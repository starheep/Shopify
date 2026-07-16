from django.utils import timezone

from myapp.Models.Product_Explorer import Product, Offer
from myapp.Models.Price_Intelligence import PriceHistory

from myapp.Confidential.Keys import (
    RAPID_API_KEY, 
    RAPID_API_HOST_AMAZON, BASE_URL_AMAZON,
    RAPID_API_HOST_FLIPKART, BASE_URL_FLIPKART,
    RAPID_API_HOST_ROBU, BASE_URL_ROBU
)

import requests
from bs4 import BeautifulSoup
import time



# Function for Price History Updation
def Price_History(product, vendor, price):
    PriceHistory.objects.update_or_create(
            product=product,
            vendor=vendor, 
            recorded_date=timezone.now().date(),
            defaults={'price': price}
        )


''' __________________________________ - Raw Scraping - _________________________________'''

# Headers 
FLIPKART_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://www.google.com/'
}



def scrape_flipkart(query):
    """
    Scrapes Flipkart Search Results directly using BeautifulSoup.
    """
    url = f"https://www.flipkart.com/search?q={query.replace(' ', '%20')}"
    print(f"[Flipkart] Scraping: {url}...")
    
    try:
        response = requests.get(url, headers=FLIPKART_HEADERS)
        if response.status_code != 200:
            print(f"Flipkart blocked request: {response.status_code}")
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        results = []

        # Flipkart usually has two types of cards:
        # 1. Horizontal (Class: _1AtVbE with inner _1fQZEK) - Common for phones/laptops
        # 2. Vertical Grid (Class: _1AtVbE with inner _4ddWXP) - Common for components/accessories
        
        # We look for the general product containers
        cards = soup.find_all('div', {'class': '_1AtVbE'})
        
        for card in cards:
            # Skip rows that are just headers/footers
            if not card.find('div', {'class': '_30jeq3'}): 
                continue

            try:
                # Extract Title (Try multiple selectors as Flipkart varies layouts)
                title_tag = card.find('div', {'class': '_4rR01T'}) or \
                            card.find('a', {'class': 's1Q9rs'}) or \
                            card.find('a', {'class': 'IRpwTa'})
                
                if not title_tag: continue
                title = title_tag.text.strip()
                
                # Extract Link
                # If title tag is an anchor <a>, use that. Else find closest anchor.
                if title_tag.name == 'a':
                    link = "https://www.flipkart.com" + title_tag['href']
                else:
                    link_tag = card.find('a', {'class': '_1fQZEK'})
                    link = "https://www.flipkart.com" + link_tag['href'] if link_tag else "#"

                # Extract Price
                price_tag = card.find('div', {'class': '_30jeq3'})
                price = 0
                if price_tag:
                    price = float(price_tag.text.replace('₹', '').replace(',', '').strip())

                # Extract Rating
                rating_tag = card.find('div', {'class': '_3LWZlK'})
                rating = float(rating_tag.text.strip()) if rating_tag else 0.0

                results.append({
                    'title': title,
                    'current_price': price,
                    'rating': rating,
                    'url': link
                })
                
                if len(results) >= 5: break # Limit to top 5

            except Exception as e:
                continue
        print(results)

        return results

    except Exception as e:
        print(f"Flipkart Scraping Error: {e}")
        return []


def scrape_amazon(kw):
    pass

def scrape_robu(kw):
    pass




''' _______________________________ - API Scraping - ______________________________'''


# For Amazon
def fetch_api(query, KEY, HOST, URL):
    """
    Calls the Real-Time Amazon Data API via RapidAPI.
    """
    querystring = {"query": query, "page": "1", "country": "IN"}  # 'IN' for Amazon India

    headers = {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST
    }

    try:
        print(f"Calling API for: {query}...")
        response = requests.get(URL, headers=headers, params=querystring)
        
        if response.status_code == 200:
            data = response.json()
            return data.get('data', {}).get('products', [])
        else:
            print(f"API Error {response.status_code}: {response.text}")
            return []
            
    except Exception as e:
        print(f"Network Error: {e}")
        return []


def save_product(name, price, rating, url, vendor, tag):
    """ Helper to save data to DB cleanly """
    
    # Clean Price
    if isinstance(price, str):
        price = float(price.replace('₹', '').replace(',', '').strip())
    
    # Truncate Name
    short_name = (name[:70] + '..') if len(name) > 70 else name

    # Get Product
    product, _ = Product.objects.get_or_create(
        name=short_name,
        defaults={
            'category': 'Electronics', # You can make this dynamic if needed
            'tags': f"{tag.lower()}, {vendor.lower()}"
        }
    )

    # Update Offer
    Offer.objects.update_or_create(
        product=product,
        vendor=vendor,
        defaults={
            'price': price,
            'rating': float(rating) if rating else 0.0,
            'delivery_days': 4, # APIs rarely give this, so we estimate
            'url': url
        }
    )
    Price_History(product, vendor, price)

def add_amazon(keywords, n, mode=0):
    total_added = 0
    for kw in keywords:
        if mode==0:
            products = fetch_api(kw, RAPID_API_KEY, RAPID_API_HOST_AMAZON, BASE_URL_AMAZON)
        else:
            products = scrape_amazon(kw)
        
        if n==-1:
            pass
        else:
            products = products[:n]
            # n = 1,2,3,4,5...
            # Usually limit to top 5 to save API quota
        
        for item in products:
            try:
                save_product(
                    name=item.get('product_title', 'Unknown'),
                    price=item.get('product_price', '0'),
                    rating=item.get('product_star_rating', 0),
                    url=item.get('product_url', '#'),
                    vendor="Amazon",
                    tag=kw
                )
                total_added += 1
                
            except Exception as e:
                print(f"Skipping item due to data error: {e}")
                continue
            
            # Sleep to avoid hitting API rate limits
            time.sleep(1)
            
    return total_added

def add_flipkart(keywords, n, mode):
    total_added = 0
    
    for kw in keywords:
        if mode==0:
            products = fetch_api(kw, RAPID_API_KEY, RAPID_API_HOST_FLIPKART, BASE_URL_FLIPKART)
        else:
            products = scrape_flipkart(kw)
        
        if n==-1:
            pass
        else:
            products = products[:n]
            # n = 1,2,3,4,5...
            # Usually limit to top 5 to save API quota
            
        for item in products:
            print(item)
            try:
                # Mapping fields based on schema
                save_product(
                    name=item.get('title', 'Unknown'),
                    price=item.get('current_price', 0),
                    rating=item.get('rating', 0),
                    url=item.get('url', '#'),
                    vendor="Flipkart",
                    tag=kw
                )
                total_added += 1
                
            except Exception as e: 
                print(f"Error saving Flipkart item: {e}")
                continue
        
        # Sleep to avoid hitting API rate limits
        time.sleep(1)
    
    return total_added

def add_robu(keywords, n, mode):
    total_added = 0
    
    for kw in keywords:
        if mode==0:
            products = fetch_api(kw, RAPID_API_KEY, RAPID_API_HOST_ROBU, BASE_URL_ROBU)
        else:
            products = scrape_robu(kw)
            
        if n==-1:
            pass
        else:
            products = products[:n]
            # n = 1,2,3,4,5...
            # Usually limit to top 5 to save API quota
    
    return total_added


def fetch_and_store_products_real():
    """
    The main function called by Django Admin.
    It loops through our keyword list, scrapes real data, and saves to DB.
    """
    # Keywords to search for (Add more if you want)
    # keywords = ["Arduino Uno", "ESP32", "DC Motor", "Jumper Wires", "Raspberry Pi 4"]
    # keywords = ["mechanical"]
    keywords = []
    
    n = -1
    
    total_added1 = add_amazon(keywords, n, 0)
    total_added2 = 0 #add_flipkart(keywords, n, 1)
    total_added3 = 0 #add_robu(keywords, n, 0)
    
    total_added = total_added1+total_added2+total_added3

    return f"Success! Fetched: {total_added}, Amazon: {total_added1}, Flipkart: {total_added2}, Robu: {total_added3}"




''' _______________________________ - Return Call - ______________________________'''

def fetch_and_store_products():
    return fetch_and_store_products_real()