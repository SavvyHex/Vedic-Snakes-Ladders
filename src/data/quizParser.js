// Load quiz questions from JSON file
export async function loadQuizQuestions() {
    try {
        console.log('Loading quiz questions from JSON...');
        const response = await fetch('/assets/data/quizQuestions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const questions = await response.json();
        console.log('Quiz questions loaded:', questions);
        return questions;
    } catch (error) {
        console.error('Failed to load quiz questions:', error);
        return {};
    }
}

export default { loadQuizQuestions };
