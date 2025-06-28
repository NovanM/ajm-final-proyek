// InfluxDB Configuration
var influxConfig = {
  baseUrl: 'http://localhost:8086/write?db=sflow&precision=ns',
  user: 'admin',
  password: 'admin'
};

// 1. Test koneksi dasar terlebih dahulu
try {
  var testResponse = http(
    'http://localhost:8086/ping',
    'GET',
    'text/plain',
    '',
    influxConfig.user,
    influxConfig.password
  );
  logInfo('InfluxDB connection test: ' + testResponse);
} catch (e) {
  logWarning('InfluxDB connection failed: ' + e);
  throw 'Cannot continue without InfluxDB connection';
}

// 2. Definisi flow yang lebih lengkap dari contoh yang berhasil
setFlow('traffic_flow', {
  keys: 'ipsource,ipdestination,ipprotocol,tcpsourceport,tcpdestinationport',
  value: 'bytes',
  values: 'frames',
  log: true
});

// 3. Fungsi pengirim data dengan error handling yang tepat
function sendToInflux(data) {
  try {
    logInfo('Attempting to send: ' + data.split('\n')[0] + '...'); // Log baris pertama
    var response = http(
      influxConfig.baseUrl,
      'POST',
      'text/plain',
      data,
      influxConfig.user,
      influxConfig.password
    );
    logInfo('Data successfully sent to InfluxDB');
    return true;
  } catch (e) {
    logWarning('Send failed: ' + e);
    return false;
  }
}

// 4. Pemrosesan data sesuai pola yang berhasil
setIntervalHandler(function() {
  try {
    // A. Test dengan data point minimal terlebih dahulu
    if (!sendToInflux('connection_test value=1')) {
      logWarning('Aborting - basic test failed');
      return;
    }

    // B. Proses flow yang sebenarnya
    var flows = activeFlows('ALL', 'traffic_flow', 5, 0);
    // logInfo(JSON.stringify(flows));
    if (!flows || flows.length === 0) return;

    var points = [];
    flows.forEach(function(flow) {
      // Gunakan format yang mirip dengan contoh yang berhasil
      points.push(
        'traffic_metrics1,' +
        'src_ip=' + flow.key.split(',')[0] + ',' +
        'dst_ip=' + flow.key.split(',')[1] + ',' +
        'in_port=' + flow.key.split(',')[3] + ',' +
        'out_port=' + flow.key.split(',')[4] + ',' +
        'protocol=' + (flow.key.split(',')[2] || 0) + ' ' +
        'bytes=' + flow.value + ',' +
        'packets=' + flow.values[0]
      );
    });
    
    if (points.length > 0) {
      sendToInflux(points.join('\n'));
    }

  } catch (e) {
    logWarning('Processing error: ' + e);
  }
}, 5);
