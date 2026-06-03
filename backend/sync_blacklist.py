import urllib.request
import time
from sqlalchemy import text
from app import create_app, db

# Repositori GitHub publik yang berisi kompilasi data mentah (raw) Trust Positif
# Kita ambil yang paling relevan: judi online, pornografi, dll.
TRUST_POSITIF_URLS = [
    "https://raw.githubusercontent.com/alsyundawy/TrustPositif/main/gambling-onlydomains.txt",
    # Bisa tambahkan list lain misal untuk adult/pornografi jika tersedia dalam repo tersebut
    # "https://raw.githubusercontent.com/alsyundawy/TrustPositif/main/tif-onlydomains.txt" 
]

def fetch_and_sync():
    app = create_app()
    with app.app_context():
        total_inserted = 0
        total_processed = 0
        
        for url in TRUST_POSITIF_URLS:
            print(f"Mengunduh daftar dari: {url}")
            try:
                response = urllib.request.urlopen(url)
                
                # Memproses secara streaming untuk hemat memori
                batch_size = 10000
                domains_batch = []
                
                for line in response:
                    try:
                        # Decode byte ke string dan bersihkan spasi/newline
                        domain = line.decode('utf-8').strip()
                        
                        # Lewati komentar atau baris kosong
                        if not domain or domain.startswith('#') or domain.startswith('!'):
                            continue
                        
                        domains_batch.append({'domain_name': domain})
                        total_processed += 1
                        
                        # Insert per batch untuk performa optimal
                        if len(domains_batch) >= batch_size:
                            inserted = insert_batch(domains_batch)
                            total_inserted += inserted
                            domains_batch = []
                            print(f"Memproses... {total_processed} domain telah dibaca.")
                    
                    except Exception as e:
                        print(f"Error memproses baris: {e}")
                        continue
                
                # Sisa batch terakhir
                if domains_batch:
                    inserted = insert_batch(domains_batch)
                    total_inserted += inserted
                    print(f"Memproses sisa... {total_processed} domain telah dibaca.")
                    
            except Exception as e:
                print(f"Gagal mengunduh atau memproses {url}: {e}")
        
        print("="*40)
        print("SINKRONISASI SELESAI")
        print(f"Total domain diproses: {total_processed}")
        print(f"Total domain baru ditambahkan: {total_inserted}")
        print("Catatan: Angka penambahan lebih kecil jika domain sudah ada (duplicate diabaikan).")

def insert_batch(domains_batch):
    """
    Melakukan bulk insert ke PostgreSQL dengan ON CONFLICT DO NOTHING.
    Sangat efisien dan tidak akan gagal jika domain sudah ada.
    """
    try:
        sql = text("""
            INSERT INTO blacklist_domains (domain_name) 
            VALUES (:domain_name) 
            ON CONFLICT (domain_name) DO NOTHING
        """)
        # Execute batch
        result = db.session.execute(sql, domains_batch)
        db.session.commit()
        return result.rowcount
    except Exception as e:
        db.session.rollback()
        print(f"Gagal melakukan insert batch: {e}")
        return 0

if __name__ == "__main__":
    start_time = time.time()
    fetch_and_sync()
    print(f"Waktu eksekusi: {time.time() - start_time:.2f} detik")
