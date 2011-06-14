$(function() {
	var chart = new Highcharts.StockChart({
	    
	    chart: {
	        renderTo: 'container'
	    },
	    
	    xAxis: {
	    	zoomedRange: {
	    		max: usdeur[usdeur.length - 1][0], // the last reading
	    		range: 6 * 30 * 24 * 3600 * 1000 // six months
	    	}
	    },
	    
	    rangeSelector: {
	    	enabled: false
	    },
	    
	    series: [{
	        name: 'USD to EUR',
	        data: usdeur
	    }]
	});
});