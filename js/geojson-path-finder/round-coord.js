module.exports = function roundCoord(c, precision) {
	/*
    return [
        Math.round(c[0] / precision) * precision,
        Math.round(c[1] / precision) * precision,
    ];
	*/
	return [
		c[0].toFixed(-Math.log10(precision)),
		c[1].toFixed(-Math.log10(precision))
	];
};
