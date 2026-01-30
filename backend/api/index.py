"""
Vercel Serverless Handler for FastAPI
Uses Mangum to wrap the ASGI app for AWS Lambda/Vercel
"""
from mangum import Mangum
from main import app

# Create the handler for Vercel
handler = Mangum(app, lifespan="off")
