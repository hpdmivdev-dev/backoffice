const fs = require('fs');
const path = require('path');

const envFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY}'
};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

fs.writeFile(path.join(dir, 'environment.prod.ts'), envFile, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('environment.prod.ts created successfully!');
});

fs.writeFile(path.join(dir, 'environment.ts'), envFile, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('environment.ts created successfully!');
});
