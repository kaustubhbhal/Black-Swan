from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("API_KEY")

def analyze_portfolio(data):
    """
    Analyze the portfolio data and suggest actions based on the risk factors.
    """
    portfolio_data = data['portfolio_stats']
    var_95      = portfolio_data['var_95']
    es_95       = portfolio_data['es_95']
    max_drawdown= portfolio_data['max_drawdown']
    mean        = portfolio_data['mean']
    std_dev     = portfolio_data['std_dev']
    skewness    = portfolio_data['skewness']
    kurtosis    = portfolio_data['kurtosis']
    prob_loss   = portfolio_data['prob_loss']
    portfolio_value = portfolio_data.get('inital_portfolio_value', None)

    actions = []

    # If VaR is greater than 10%, suggest reducing high-risk exposure.
    if var_95 > 0.10:
        actions.append(f"ACTION: Reduce high-risk exposure: Reason: The portfolio's 95% VaR is {var_95:.2%}, indicating potential losses exceeding 10% in worst-case scenarios.")
    
    # If Expected Shortfall is above 15%, recommend increasing hedging.
    if es_95 > 0.15:
        actions.append(f"ACTION: Increase hedging: Reason: The 95% Expected Shortfall is {es_95:.2%}, suggesting a risk of catastrophic losses.")
    
    # If the maximum drawdown exceeds 35%, advise rebalancing.
    if max_drawdown > 0.35:
        actions.append(f"ACTION: Rebalance portfolio: Reason: The maximum drawdown is {max_drawdown:.2%}, which is high and indicates vulnerability during market downturns.")
    
    # If skewness is highly negative, advise adding defensive assets.
    if skewness < -1.0:
        actions.append(f"ACTION: Add defensive assets: Reason: The portfolio's skewness is {skewness:.2f}, indicating a higher likelihood of extreme negative returns.")
    
    # If kurtosis is high (e.g., above 5), recommend further diversification.
    if kurtosis > 5:
        actions.append(f"ACTION: Diversify further: Reason: A kurtosis of {kurtosis:.2f} signals heavy tails and extreme volatility in the returns distribution.")
    
    # If probability of loss is above 30%, advise increasing diversification.
    if prob_loss > 0.30:
        actions.append(f"ACTION: Increase diversification: Reason: The probability of loss is {prob_loss:.2%}, which is high and suggests overexposure to risk.")

    for stock, data in data.items():
        if stock == 'portfolio_stats':
            continue
        stock_actions = analyze_stock(stock, data)
        actions.extend(stock_actions)

    client = OpenAI(api_key=api_key)

    system_message = "You are a financial risk analysis assistant specializing in portfolio optimization and risk mitigation. Given a set of recommended actions based on statistical risk metrics, generate a concise, five-sentence summary outlining the key concerns of the portfolio and the general adjustments that should be made. Your response should be professional, structured, and focused on high-level takeaways rather than an exhaustive list of actions."

    message = f"Here is a list of recommended actions based on a portfolio stress test and risk analysis--- {actions} ---Summarize the portfolio's overall risk profile and the key adjustments that should be made in five sentences. Focus on the most critical risks and the broad strategies for addressing them."

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": message}
        ],
        temperature=0.7
    )

    summary = response.choices[0].message.content

    return actions, summary


def analyze_stock(ticker, data):
    beta = data['beta']
    sig_S = data['sig_s']
    sig_idio = data['sig_idio']
    sig_ETF = data['sig_etf']
    lambda_jump = data['lambda_jump']
    stock_data = data['stock_stats']
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


