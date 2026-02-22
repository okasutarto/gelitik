const fs = require("fs");
const path = require("path");

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".vue")) {
      let content = fs.readFileSync(fullPath, "utf-8");

      // Remove console.log entirely if on its own line
      // E.g. ^\s*console\.log\(.*?\);?\s*$
      // But we can just use a regex to match console.log(...) statements and remove them.
      // Be careful with multi-line console.logs
      const previousLength = content.length;
      content = content.replace(
        /^[ \t]*console\.log\([^;]*\);?[ \t]*\r?\n/gm,
        "",
      );
      content = content.replace(/console\.log\([^;]*\);?/g, "");

      if (content.length !== previousLength) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

// target backend and frontend src
processDirectory(path.join(__dirname, "backend", "src"));
processDirectory(path.join(__dirname, "frontend", "src"));
