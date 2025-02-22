def analyze_stock(ticker, data):
    beta = data['beta']
    sig_S = data['sig_s']
    sig_idio = data['sig_idio']
    sig_ETF = data['sig_ETF']
    lambda_jump = data['lambda_jump']


def shouldBuyPut(ticker, beta, jump):
    if beta > 1.5 and jump > 0.75:
        return True
    return False

def shouldDiversify(ticker, sig_ETF, sig_idio):
    if sig_idio / sig_ETF > 1.5:
        return True
    return False


