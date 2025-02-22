import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from stats import StockStats
from scipy import stats
import matplotlib.pyplot as plt

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

        return portfolio_simulations

    def monteCarlo(self, num_simulations, num_days):
        """
        Run Monte Carlo and compute portfolio-level risk statistics.
        """
        portfolio_simulations = self.simulate(num_simulations, num_days)
        # Get portfolio statistics using StockStats' method
        self.simulations = portfolio_simulations
        return self.getStatistics(portfolio_simulations)

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

        return var_95, es_95, max_drawdown, distribution_percentiles, mean, std_dev, skewness, kurtosis, prob_loss


# # Example usage with a portfolio of 10 stocks
# stock_dict = {
#     'AAPL': ('XLK', 100),
#     'MSFT': ('XLK', 100),
#     'AMZN': ('XLY', 100),
#     'GOOGL': ('XLK', 100),
#     'META': ('XLK', 100),
#     'TSLA': ('XLY', 100),
#     'NVDA': ('XLK', 100),
#     'JPM': ('XLF', 100),
#     'V': ('XLF', 100),
#     'MA': ('XLF', 100)
# }
# # history will start on the start date of the dot com bubble burst and run for 2 years
# history_start_date = '2000-03-10'
# history_end_date = '2002-03-10'
# portfolio_mc = PortfolioMonteCarlo(stock_dict, history_start_date, history_end_date)
# var_95, es_95, max_drawdown, distribution_percentiles, mean, std_dev, skewness, kurtosis, prob_loss = portfolio_mc.monteCarlo(1000, 252)
# print(f"95% Value at Risk: {var_95}")
# print(f"95% Expected Shortfall: {es_95}")
# print(f"Maximum Drawdown: {max_drawdown}")
# print(f"Distribution Percentiles: {distribution_percentiles}")
# print(f"Mean: {mean}")
# print(f"Standard Deviation: {std_dev}")
# print(f"Skewness: {skewness}")
# print(f"Kurtosis: {kurtosis}")
# print(f"Probability of Losses Exceeding Initial Portfolio Value: {prob_loss}")

# # Now we want to graph the portfolio simulations and save the png
# num = 500
# days = 252
# simulations = portfolio_mc.simulate(num, days)
# plt.figure(figsize=(14, 7))
# plt.plot(simulations.T, color='blue', alpha=0.03)
# plt.title('Monte Carlo Simulations of Portfolio Value')
# plt.xlabel('Trading Days')
# plt.ylabel('Portfolio Value')
# plt.savefig('portfolio_simulations.png')

# # Now we also want to graph the distribution of overall returns over this time period
# # But i want it to show the ANNUALIZED RETURNS, not the portfolio value
# annualized_returns = np.zeros(num)
# for i in range(num):
#     annualized_returns[i] = (simulations[i, -1] / np.sum([s.start_value for s in portfolio_mc.stocks])) ** (1 / (days / 252)) - 1
# plt.figure(figsize=(14, 7))
# plt.hist(annualized_returns, bins=50, color='blue', alpha=0.7)
# plt.title('Distribution of Annualized Returns')
# plt.xlabel('Annualized Return')
# plt.ylabel('Frequency')
# # and save the png
# plt.savefig('annualized_returns_distribution.png')
