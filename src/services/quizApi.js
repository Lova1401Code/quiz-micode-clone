// Service API pour Open Trivia DB
export const fetchQuiz = async (amount = 10, category = null, difficulty = null) => {
  try {
    let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    
    if (category) url += `&category=${category}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    
    if (data.response_code !== 0) {
      throw new Error('API returned error code');
    }
    
    return data.results;
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    throw error;
  }
};

// Récupérer les catégories disponibles
export const fetchCategories = async () => {
  try {
    const response = await fetch('https://opentdb.com/api_category.php');
    const data = await response.json();
    return data.trivia_categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};
