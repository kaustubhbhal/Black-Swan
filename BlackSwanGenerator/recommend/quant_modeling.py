def analyze_portfolio(portfolio_data):
    """
    Analyze the portfolio data and suggest actions based on the risk factors.
    """


def analyze_stock(ticker, data):
    beta = data['beta']
    sig_S = data['sig_s']
    sig_idio = data['sig_idio']
    sig_ETF = data['sig_ETF']
    lambda_jump = data['lambda_jump']
    stock_data = data['stock_data']
    var_95 = stock_data['var_95']
    es_95 = stock_data['es_95']
    max_drawdown = stock_data['max_drawdown']
    mean = stock_data['mean']
    prob_loss = stock_data['prob_loss']

    actions = []
    
    # Check if the stock requires buying put options
    if should_buy_put(beta, lambda_jump):
        actions.append(f"ACTION: Buy Put Options for {ticker}: Reason: Stock beta ({beta}) and jump risk (λ={lambda_jump}) are high, indicating a higher chance of downward jumps.")
    
    # Check if the stock requires switching to ETF for diversification
    if should_switch_to_etf(sig_ETF, sig_idio):
        actions.append(f"ACTION: Switch {ticker} to ETF: Reason: The ETF signal ({sig_ETF}) is stronger than the idiosyncratic risk ({sig_idio}), suggesting better diversification in an ETF.")
    
    # Check if the stock position should be reduced due to max drawdown
    if should_reduce_position(max_drawdown):
        actions.append(f"ACTION: Reduce position in {ticker}: Reason: The stock's max drawdown is {max_drawdown:.2f}, which is considered high and poses significant risk.")
    
    # Check if the stock requires an increase in hedging due to risk
    if should_do_increase_hedge(var_95, es_95):
        actions.append(f"ACTION: Increase hedge for {ticker}: Reason: The VaR at 95% is {var_95:.2f} and ES at 95% is {es_95:.2f}, indicating significant tail risk in the portfolio.")
    
    # Check if the stock portfolio should be diversified
    if should_do_diversify(prob_loss, mean):
        actions.append(f"ACTION: Diversify portfolio: Reason: The probability of loss is {prob_loss*100:.2f}% and the expected return is {mean*100:.2f}%, suggesting the portfolio is exposed to risk with limited upside.")

    # Return all suggested actions for the stock
    return actions


def should_buy_put(beta, jump):
    if beta > 1.5 and jump > 0.75:
        return True
    return False

def should_switch_to_etf(sig_ETF, sig_idio):
    if sig_idio > 1.5 * sig_ETF:
        return True
    return False

def should_reduce_position(max_drawdown):
    """
    Suggests reducing position size if the stock's maximum drawdown is too high (e.g., 35%).
    """
    return max_drawdown > 0.35  # Reduce position if drawdown exceeds 35%

def should_do_increase_hedge(var_95, es_95):
    """
    Suggests increasing hedging if Value at Risk (VaR) or Expected Shortfall (ES) is too high.
    """
    return var_95 > 0.10 or es_95 > 0.15  # If VaR > 10% or ES > 15%

def should_do_diversify(prob_loss, mean):
    """
    Suggests diversifying portfolio if the probability of loss is high or mean return is too low.
    """
    return prob_loss > 0.30 or mean < 0.05  # If probability of loss > 30% or mean return < 5%


