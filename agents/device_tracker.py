import os
import requests
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = FastAPI()


class OuraAgent:
    def __init__(self):
        self.OURA_TOKEN = os.getenv("OURA_TOKEN")

        self.BASE_URL = "https://api.ouraring.com/v2/usercollection"


    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.OURA_TOKEN}"
        }


    def get_date_range(self, days: int = 7):
        end = datetime.utcnow().date()
        start = end - timedelta(days=days)
        return start.isoformat(), end.isoformat()


    @app.get("/oura/sleep")
    def fetch_sleep(self):
        start, end = self.get_date_range()
        url = f"{self.BASE_URL}/sleep?start_date={start}&end_date={end}"
        response = requests.get(url, headers=self.get_headers())
        return JSONResponse(content=response.json())


    @app.get("/oura/readiness")
    def fetch_readiness(self):
        start, end = self.get_date_range()
        url = f"{self.BASE_URL}/readiness?start_date={start}&end_date={end}"
        response = requests.get(url, headers=self.get_headers())
        return JSONResponse(content=response.json())


    @app.get("/oura/activity")
    def fetch_activity(self):
        start, end = self.get_date_range()
        url = f"{self.BASE_URL}/daily_activity?start_date={start}&end_date={end}"
        response = requests.get(url, headers=self.get_headers())
        return JSONResponse(content=response.json())
