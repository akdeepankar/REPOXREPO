// Very naive placeholder recommendation logic
export function calculateRecommendations(profile){
  if(!profile) return [];
  const sectors = ['Technology','Healthcare','Agriculture','Education'];
  return Array.from({length: 6}).map((_,i)=>({
    id: String(i+1),
    title: `${sectors[i%sectors.length]} Internship ${i+1}`,
    organization: 'Gov Dept ' + ((i%3)+1),
    location: profile.location || 'Remote',
    deadline: '2025-12-31',
    stipend: '₹4500 + ₹500',
    sector: sectors[i%sectors.length],
    description: 'Hands-on experience contributing to national initiatives.'
  }));
}
