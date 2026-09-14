"""
AI Stock Intelligence
First step: prepare our stock data.
"""

import yfinance as yf


def get_stock_data(ticker, period="1y"):
    """Download historical market data for one stock."""
    data = yf.download(ticker, period=period, auto_adjust=True)

    return data


if __name__ == "__main__":
    stock = get_stock_data("AAPL")
    print(stock.tail())
