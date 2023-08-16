function getCurrentInvestmentValue(_itemName) {
    return 100.0;
}

function getInitialInvestmentValue(_itemName) {
    return 100.0;
}

function getMargin(_itemName) {
    return getCurrentInvestmentValue(_itemName) - getInitialInvestmentValue(_itemName);
}