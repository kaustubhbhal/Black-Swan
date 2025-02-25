import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from .stats import StockStats
from scipy import stats
import base64
from io import BytesIO
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import json

class PortfolioMonteCarlo:
    def __init__(self, stock_dict, history_start_date, history_end_date):
        """
        stock_dict: Dictionary with format {ticker: (ETF_ticker, shares)}
        history_start_date, history_end_date: Historical data range for calculations
        """
        self.stock_dict = stock_dict
        self.history_start_date = history_start_date
        self.history_end_date = history_end_date
        self.stocks = []
        for ticker, (etf_ticker, shares) in stock_dict.items():
            self.stocks.append(StockStats(ticker, etf_ticker, history_start_date, history_end_date, shares))
        self.num_stocks = len(self.stocks)
        self.simulations = np.zeros((1000, 252))
        self.portfolio_value = sum([s.start_value for s in self.stocks])
        self.max_y = 2 * self.portfolio_value
        self.recommendations = {}

    def simulate(self, num_simulations, num_days):
        """
        Run Monte Carlo simulations for the entire portfolio.
        """
        # Initialize portfolio simulation matrix (num_simulations x num_days)
        portfolio_simulations = np.zeros((num_simulations, num_days))

        # Simulate each stock and add its contribution to the portfolio
        for stock in self.stocks:
            stock_simulations = stock.monteCarlo(num_simulations,num_days)
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
        plt.close()

        # Create a JSON object with the base64 image
        img_json = {'image': img_base64}

        
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
        plt.close()

        # Create a JSON object with the base64 image
        img_json1 = {'image': img_base64_1}

        return img_json1

    def generate_no_jump(self):
        stocks = []
        for ticker, (etf_ticker, shares) in self.stock_dict.items():
            stocks.append(StockStats(ticker, etf_ticker, self.history_start_date, self.history_end_date, shares, False))
        
        # Initialize portfolio simulation matrix (num_simulations x num_days)
        portfolio_simulations = np.zeros((1000, 252))

        # Simulate each stock and add its contribution to the portfolio
        for stock in stocks:
            stock_simulations = stock.monteCarlo(1000,252)
            portfolio_simulations += stock_simulations  # Sum stock values for portfolio aggregation        
        
        plt.figure(figsize=(14, 7))
        plt.plot(portfolio_simulations.T, color='blue', alpha=0.03)
        plt.title('Monte Carlo Simulations of Portfolio Value (No Black Swan Events)')
        plt.xlabel('Trading Days')
        
         # Save the plot to a BytesIO object
        buf = BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        # Encode the image as base64
        img_base64_2 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        plt.close()

        # Create a JSON object with the base64 image
        img_json2 = {'image': img_base64_2}

        return img_json2

    def getStatistics(self, simulations):
        """
        Compute portfolio-level risk statistics.
        """
        final_values = simulations[:, -1]
        var_95 = np.percentile(final_values, 5)
        es_95 = np.mean(final_values[final_values < var_95])
        max_drawdown = np.max(np.maximum.accumulate(final_values) - final_values)
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
            'mean': mean,
            'std_dev': std_dev,
            'skewness': skewness,
            'kurtosis': kurtosis,
            'prob_loss': prob_loss,
            'inital_portfolio_value': self.portfolio_value
        }
