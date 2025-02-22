import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from stats import StockStats
from scipy import stats
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import json

class PortfolioMonteCarlo:
    def __init__(self, stock_dict, history_start_date, history_end_date):
        """
        stock_dict: Dictionary with format {ticker: (ETF_ticker, shares)}
        history_start_date, history_end_date: Historical data range for calculations
        """
        self.stocks = []
        for ticker, (etf_ticker, shares) in stock_dict.items():
            self.stocks.append(StockStats(ticker, etf_ticker, history_start_date, history_end_date, shares))
        self.num_stocks = len(self.stocks)
        self.simulations = None

    def simulate(self, num_simulations, num_days):
        """
        Run Monte Carlo simulations for the entire portfolio.
        """
        # Initialize portfolio simulation matrix (num_simulations x num_days)
        portfolio_simulations = np.zeros((num_simulations, num_days))

        # Simulate each stock and add its contribution to the portfolio
        for stock in self.stocks:
            stock_simulations = np.zeros((num_simulations, num_days))
            for i in range(num_simulations):
                stock_simulations[i] = stock.simulate(num_days)
            portfolio_simulations += stock_simulations  # Sum stock values for portfolio aggregation
        self.simulations = portfolio_simulations
        return portfolio_simulations

    def monteCarlo(self, num_simulations, num_days):
        """
        Run Monte Carlo and compute portfolio-level risk statistics.
        """
        portfolio_simulations = self.simulate(num_simulations, num_days)
        # Get portfolio statistics using StockStats' method
        return self.getStatistics(portfolio_simulations)

    def generate_monte(self):
        simulations = self.simulations
        plt.figure(figsize=(14, 7))
        plt.plot(simulations.T, color='blue', alpha=0.03)
        plt.title('Monte Carlo Simulations of Portfolio Value')
        plt.xlabel('Trading Days')
        
         # Save the plot to a BytesIO object
        buf = BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        # Encode the image as base64
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        # Create a JSON object with the base64 image
        img_json = {'image': img_base64}

        # Save the JSON object to a file
        with open('portfolio_simulations.json', 'w') as f:
            json.dump(img_json, f)
        
        return img_json

    def generate_returns_annualized(self):
        num = 500
        days = 252
        simulations = self.simulations
        annualized_returns = np.zeros(num)
        for i in range(num):
            annualized_returns[i] = (simulations[i, -1] / np.sum([s.start_value for s in self.stocks])) ** (1 / (days / 252)) - 1
        plt.figure(figsize=(14, 7))
        plt.hist(annualized_returns, bins=50, color='blue', alpha=0.7)
        plt.title('Distribution of Annualized Returns')
        plt.xlabel('Annualized Return')
        plt.ylabel('Frequency')
        
         # Save the plot to a BytesIO object
        buf = BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        # Encode the image as base64
        img_base64_1 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()

        # Create a JSON object with the base64 image
        img_json1 = {'image': img_base64_1}

        # Save the JSON object to a file
        with open('portfolio_simulations.json', 'w') as f:
            json.dump(img_json1, f)
        
        return img_json1


    def getStatistics(self, simulations):
        """
        Compute portfolio-level risk statistics.
        """
        final_values = simulations[:, -1]
        var_95 = np.percentile(final_values, 5)
        es_95 = np.mean(final_values[final_values < var_95])
        max_drawdown = np.max(np.maximum.accumulate(final_values) - final_values)
        distribution_percentiles = np.percentile(final_values, [1, 5, 25, 50, 75, 95, 99])
        mean = np.mean(final_values)
        std_dev = np.std(final_values)
        skewness = stats.skew(final_values)
        kurtosis = stats.kurtosis(final_values)
        prob_loss = np.mean(final_values < np.sum([s.start_value for s in self.stocks]))  # Compare to initial portfolio value

        # we want to return the following values in a dict with var_name: value
        return {
            'var_95': var_95,
            'es_95': es_95,
            'max_drawdown': max_drawdown,
            'distribution_percentiles': distribution_percentiles,
            'mean': mean,
            'std_dev': std_dev,
            'skewness': skewness,
            'kurtosis': kurtosis,
            'prob_loss': prob_loss
        }

# Example usage with a portfolio of 10 stocks
stock_dict = {
    'AAPL': ('XLK', 100),
    'MSFT': ('XLK', 100),
    'AMZN': ('XLY', 100),
    'GOOGL': ('XLK', 100),
    'META': ('XLK', 100),
    'TSLA': ('XLY', 100),
    'NVDA': ('XLK', 100),
    'JPM': ('XLF', 100),
    'V': ('XLF', 100),
    'MA': ('XLF', 100)
}
history_start_date = '2000-03-10'
history_end_date = '2002-03-10'
portfolio = PortfolioMonteCarlo(stock_dict, history_start_date, history_end_date)
# Doing the Graphing functions
portfolio.monteCarlo(1000, 252)
monte_image = portfolio.generate_monte()
returns_image = portfolio.generate_returns_annualized()
print(monte_image)
print(returns_image)

# now we want to convert the images from base64 to a png and download it
# we will use the PIL library to do this
from PIL import Image
import io

# convert the base64 image to a PIL image
returns_image_data = base64.b64decode(returns_image['image'])
# save this as a png
img = Image.open(io.BytesIO(returns_image_data))
img.save('returns_image.png', 'PNG')