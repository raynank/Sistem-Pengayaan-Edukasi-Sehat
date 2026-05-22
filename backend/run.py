from app import create_app

app = create_app()

if __name__ == '__main__':
    # Run the Flask app
    # Note: For production use Gunicorn (e.g., gunicorn -w 4 -b 127.0.0.1:5000 run:app)
    app.run(debug=True, host='0.0.0.0', port=5000)
