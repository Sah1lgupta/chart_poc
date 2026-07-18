// tool/build_mobile_html.dart
//
// Generates a self-contained chart_mobile.html by inlining every
// external <script src="..."> reference found in chart.html.
//
// Usage (from packages/chart_engine/):
//   dart run tool/build_mobile_html.dart
//
// This must be re-run whenever any JS file under assets/chart/ changes.

import 'dart:io';

void main() {
  final baseDir = Directory('assets/chart');
  final inputFile = File('${baseDir.path}/chart.html');
  final outputFile = File('${baseDir.path}/chart_mobile.html');

  if (!inputFile.existsSync()) {
    stderr.writeln('ERROR: ${inputFile.path} not found.');
    stderr.writeln('Run this script from packages/chart_engine/');
    exit(1);
  }

  final html = inputFile.readAsStringSync();
  final buffer = StringBuffer();

  // Regex to match <script src="..."></script> tags
  // Captures the src attribute value
  final scriptSrcPattern = RegExp(
    r'<script\s+src="([^"]+)"\s*>\s*</script>',
    caseSensitive: false,
  );

  int lastEnd = 0;

  for (final match in scriptSrcPattern.allMatches(html)) {
    // Append everything before this match
    buffer.write(html.substring(lastEnd, match.start));

    final srcPath = match.group(1)!;
    final jsFile = File('${baseDir.path}/$srcPath');

    if (!jsFile.existsSync()) {
      stderr.writeln('WARNING: JS file not found: ${jsFile.path} — skipping inline.');
      buffer.write(match.group(0)); // keep original tag
    } else {
      final jsContent = jsFile.readAsStringSync();
      stdout.writeln('  Inlined: $srcPath (${jsContent.length} bytes)');
      buffer.writeln('<script>');
      buffer.writeln('// === Inlined from: $srcPath ===');
      buffer.writeln(jsContent);
      buffer.writeln('</script>');
    }

    lastEnd = match.end;
  }

  // Append remainder of the HTML
  buffer.write(html.substring(lastEnd));

  outputFile.writeAsStringSync(buffer.toString());

  final inputSize = inputFile.lengthSync();
  final outputSize = outputFile.lengthSync();

  stdout.writeln('');
  stdout.writeln('✅ Generated: ${outputFile.path}');
  stdout.writeln('   Source HTML:   ${_formatBytes(inputSize)}');
  stdout.writeln('   Output HTML:   ${_formatBytes(outputSize)}');
  stdout.writeln('   JS files inlined: ${scriptSrcPattern.allMatches(html).length}');
}

String _formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
