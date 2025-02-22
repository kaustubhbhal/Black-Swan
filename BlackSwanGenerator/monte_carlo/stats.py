import numpy as np
import yfinance as yf
import pandas as pd
import statsmodels.api as sm
from scipy import stats
import matplotlib.pyplot as plt

class StockStats:
    def __init__(self, ticker, ETF_ticker, history_start_date, history_end_date, shares, jumping=True):
        self.start_date = history_start_date
        self.end_date = history_end_date
        self.ticker = ticker
        self.ETF = ETF_ticker
        self.shares = shares
        self.start_value = None
        self.beta = None
        self.mu_ETF = None
        self.sig_ETF = None
        self.sig_S = None
        self.sig_idio = None
        self.dt = 1 / 252
        self.calculate_statistics()
        self.lambda_jump = None
        self.mu_J = None
        self.sigma_J = None
        self.estimate_jump_params()
        # We want to store the simulations as a 2d numpy array
        self.simulations = None
        self.jumping = jumping
        self.statistics = {}

    def calculate_statistics(self):
        # Assign the start value of the stock
        self.start_value = yf.Ticker(self.ticker).history(period='1d')['Close'][0] * self.shares

        start_date = "2018-01-01"
        end_date = "2024-01-01"

        stock_hist = yf.download(self.ticker, start=start_date, end=end_date)
        stock_hist['LogReturn'] = np.log(stock_hist['Close'] / stock_hist['Close'].shift(1))
        stock_hist = stock_hist.dropna()
        self.sig_S = np.std(stock_hist['LogReturn']) * (252 ** 0.5)

        etf_hist = yf.download(self.ETF, start=start_date, end=end_date)
        etf_hist['LogReturn'] = np.log(etf_hist['Close'] / etf_hist['Close'].shift(1))
        etf_hist = etf_hist.dropna()
        self.mu_ETF = np.mean(etf_hist['LogReturn']) * 252
        self.sig_ETF = np.std(etf_hist['LogReturn']) * (252 ** 0.5)

        # Merge
        merged_df = pd.merge(stock_hist[['LogReturn']], etf_hist[['LogReturn']], left_index=True, right_index=True, suffixes=('_stock', '_etf'))
        merged_df = merged_df.dropna()

        merged_df.columns = ['LogReturn_stock', 'LogReturn_etf']

        X = merged_df['LogReturn_etf']
        y = merged_df['LogReturn_stock']
        X = sm.add_constant(X)
        model = sm.OLS(y, X).fit()
        
        self.beta = model.params['LogReturn_etf']
        self.sig_idio = np.sqrt(self.sig_S ** 2 - self.beta ** 2 * self.sig_ETF ** 2)

    def estimate_jump_params(self):
        jump_thresholds = stats.norm.ppf(0.01)  # 1% quantile for a normal distribution
        
        etf_hist = yf.download(self.ETF, start=self.start_date, end=self.end_date)
        etf_hist['LogReturn'] = np.log(etf_hist['Close'] / etf_hist["Close"].shift(1)).dropna()
        mean_ret = etf_hist['LogReturn'].mean()
        std_ret = etf_hist['LogReturn'].std()
        jump_cutoff = mean_ret - jump_thresholds * std_ret

        jump_events = etf_hist[etf_hist['LogReturn'] < jump_cutoff]['LogReturn']

        etf_hist.index = pd.to_datetime(etf_hist.index)
        period_years = len(etf_hist) / 252

        self.lambda_jump = len(jump_events) / period_years * self.dt
        self.mu_J = jump_events.mean()
        self.sigma_J = jump_events.std()

    def calculateDrift(self):
        return (self.mu_ETF * self.beta - 0.5 * (self.beta ** 2 * self.sig_ETF ** 2 + self.sig_idio ** 2)) * self.dt
    
    def calculateSystematicVolatility(self):
        return self.beta * self.sig_ETF * (self.dt ** 0.5) * np.random.normal()
    
    def calculateIdiosyncraticVolatility(self):
        return self.sig_idio * (self.dt ** 0.5) * np.random.normal()
    
    def calculateJump(self):
        if not self.jumping:
            return 0
        N_T = np.random.poisson(self.lambda_jump)
        if N_T > 0:
            jump_magnitudes = np.random.normal(self.mu_J, self.sigma_J, N_T)
            J_T = np.sum(jump_magnitudes)
        else:
            J_T = 0
        return J_T
    
    def simulate(self, num_days):
        S = np.zeros(num_days)
        S[0] = self.start_value
        for i in range(1, num_days):
            drift = self.calculateDrift()
            systematic_volatility = self.calculateSystematicVolatility()
            idiosyncratic_volatility = self.calculateIdiosyncraticVolatility()
            jump = self.calculateJump()
            S[i] = S[i - 1] * np.exp(drift + systematic_volatility + idiosyncratic_volatility + jump)
        return S
    
    def getStatistics(self):
        """
        Calculate Value at Risk, Expected Shortfall (ES) or Conditional VaR, Maximum Drawdown, Distribution Percentiles, Mean and Standard Deviation, Skewness and Kurtosis, and Probability of Losses Exceeding a Given Threshold.
        simulations is an array of shape (num_simulations, num_days), where each row is a simulation of stock prices over num_days days.
        """
        simulations = self.simulations
        print(simulations)
        final_values = simulations[:, -1]
        var_95 = np.percentile(final_values, 5)
        es_95 = np.mean(final_values[final_values < var_95])
        max_drawdown = np.max(np.maximum.accumulate(final_values) - final_values)
        mean = np.mean(final_values)
        std_dev = np.std(final_values)
        skewness = stats.skew(final_values)
        kurtosis = stats.kurtosis(final_values)
        prob_loss = np.mean(final_values < self.start_value)
        # we want to return a dictionary of these values with var_name:valeue
        return {
            'var_95': var_95,
            'es_95': es_95,
            'max_drawdown': max_drawdown,
            'mean': mean,
            'std_dev': std_dev,
            'skewness': skewness,
            'kurtosis': kurtosis,
            'prob_loss': prob_loss,
            'initial_value': self.start_value
        }

    
    def monteCarlo(self, num_simulations, num_days):
        simulations = np.zeros((num_simulations, num_days))
        # Store the first 20 simulations for later plotting
        for i in range(num_simulations):
            simulations[i] = self.simulate(num_days)
        self.simulations = simulations
        self.statistics = self.getStatistics()
        return self.statistics