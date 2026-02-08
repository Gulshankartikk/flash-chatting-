const otpGenerate =() => {
    return Math.floor(100000 + Math.randam() * 900000).toString();
}

module.exports = otpGenerate;