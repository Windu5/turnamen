const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lufgyapceirnnnqqtlou.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Zmd5YXBjZWlybm5ucXF0bG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTE0MzksImV4cCI6MjEwMjQ2NzQzOX0.vz76mG66pcVv-hGGc6BABJzkmXvbjwYSDGdtlQJ5Exk');

async function test() {
  const { data, error } = await supabase.from('tournaments').select('*').limit(1);
  console.log(data, error);
}
test();
