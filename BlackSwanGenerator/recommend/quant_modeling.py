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
    std_dev = stock_data['std_dev']
    skewness = stock_data['skewness']
    kurtosis = stock_data['kurtosis']
    prob_loss = stock_data['prob_loss']


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
