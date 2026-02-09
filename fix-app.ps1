$lines = Get-Content src/App.tsx
$newLines = $lines[0..1004]
$newLines += ""
$newLines += "// 使用HashRouter"
$newLines += "function App() {"
$newLines += "  return ("
$newLines += "    <HashRouter>"
$newLines += "      <AppContent />"
$newLines += "    </HashRouter>"
$newLines += "  );"
$newLines += "}"
$newLines += ""
$newLines += "export default App;"
$newLines | Set-Content src/App.tsx -Encoding UTF8
