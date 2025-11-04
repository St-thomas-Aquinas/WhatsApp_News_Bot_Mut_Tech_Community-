import os
import requests
import feedparser
import sqlite3
import schedule
import time
from transformers import pipeline

# --- CONFIG ---
WPP_URL = os.getenv("WPP_URL")
INSTANCE = "default"
GROUP_ID = os.getenv("GROUP_ID")
DB_FILE = "sent_articles.db"

# --- DATABASE ---
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
cursor.execute("CREATE TABLE IF NOT EXISTS sent (link TEXT PRIMARY KEY)")
conn.commit()

# --- SUMMARIZER ---
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def fetch_articles():
    feeds = [
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml",
        "https://www.wired.com/feed/rss",
        "https://www.engadget.com/rss.xml"
    ]
    articles = []
    for f in feeds:
        feed = feedparser.parse(f)
        for entry in feed.entries[:3]:
            articles.append({
                "title": entry.title,
                "link": entry.link,
                "summary": entry.summary
            })
    return articles

def is_new(link):
    cursor.execute("SELECT 1 FROM sent WHERE link = ?", (link,))
    return cursor.fetchone() is None

def mark_sent(link):
    cursor.execute("INSERT OR IGNORE INTO sent (link) VALUES (?)", (link,))
    conn.commit()

def summarize(text):
    try:
        result = summarizer(text, max_length=70, min_length=25, do_sample=False)
        return result[0]['summary_text']
    except Exception:
        return text[:250] + "..."

def send_whatsapp(message):
    payload = {
        "session": INSTANCE,
        "number": GROUP_ID,
        "text": message
    }
    try:
        r = requests.post(WPP_URL, json=payload)
        print("✅ Sent:", r.status_code)
    except Exception as e:
        print("❌ Error:", e)

def daily_news():
    print("📰 Fetching Tech News...")
    for art in fetch_articles():
        if not is_new(art["link"]):
            continue
        summary = summarize(art["summary"])
        msg = f"🧠 *{art['title']}*\n\n{summary}\n🔗 {art['link']}"
        send_whatsapp(msg)
        mark_sent(art["link"])
    print("✅ Done.\n")

schedule.every().day.at("09:00").do(daily_news)
daily_news()  # optional immediate run

while True:
    schedule.run_pending()
    time.sleep(60)
