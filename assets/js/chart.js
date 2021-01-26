// Load the Visualization API and the corechart package.
google.charts.load('current', {'packages':['corechart']});
// Set a callback to run when the Google Visualization API is loaded.
// google.charts.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
  console.log('drawing charts');
  console.log(activeStatisticsJson);
  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Male');
  data.addColumn('number', 'Female');
  data.addRows([
  ['Male', activeStatisticsJson['male_population']],
  ['Female', activeStatisticsJson['female_population']],
  ]);

  // Set chart options
  var options = {'title':'Population Data',
              'width':400,
              'height':300};

  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.PieChart(document.getElementById('chart'));
  chart.draw(data, options);
}