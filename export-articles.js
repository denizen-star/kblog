const fs = require('fs');
const path = require('path');

// Read the articles JSON file
const articlesPath = path.join(__dirname, 'data', 'articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

// Extract and format the data
const output = [];
output.push('Published timestamp | Title | Excerpt | Author');
output.push('--- | --- | --- | ---');

articlesData.articles.forEach(article => {
  const published = article.published || '';
  const title = (article.title || '').replace(/\|/g, '|'); // Escape pipes in title
  const excerpt = (article.excerpt || '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\|/g, '|').trim(); // Clean excerpt and escape pipes
  const author = article.author?.name || '';
  
  output.push(`${published} | ${title} | ${excerpt} | ${author}`);
});

// Write to file in docs folder
const outputPath = path.join(__dirname, 'docs', 'articles-export.txt');
fs.writeFileSync(outputPath, output.join('\n'), 'utf8');

console.log(`✅ Created ${outputPath}`);
console.log(`📊 Exported ${articlesData.articles.length} articles`);


