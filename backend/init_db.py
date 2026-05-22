from app import create_app, db

app = create_app()

def init_db():
    with app.app_context():
        # Create all tables defined in models.py
        db.create_all()
        print("Database initialized successfully.")
        
        # Seed initial blacklist domains
        from app.models import BlacklistDomain
        
        # Hapus data lama agar daftar selalu sinkron dengan skrip ini
        print("Cleaning old blacklist data...")
        BlacklistDomain.query.delete()
        
        print("Seeding updated blacklist domains...")
        sample_domains = [
            BlacklistDomain(domain_name='pornhub.com'),
            BlacklistDomain(domain_name='nhentai.net'),
            BlacklistDomain(domain_name='xvideos.com'),
        ]
        db.session.add_all(sample_domains)
        db.session.commit()
        print("Blacklist updated successfully.")

if __name__ == '__main__':
    init_db()
