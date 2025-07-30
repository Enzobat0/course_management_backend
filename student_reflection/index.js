const translations = {
    en: {
        pageTitle: "Student Reflection",
        greetingTitle: "Thank you for taking the time to reflect on this course!",
        greetingMessage: "Your feedback is invaluable in helping us improve our courses and better serve our students.",
        question1: "What was the most challenging part of the course?",
        challengeInputPlaceholder: "Describe the most challenging part of the course...",
        question2: "If you had to pick one, what is one key takeaway from this course, if any?",
        keyTakeawayInputPlaceholder: "Describe your key takeaway...",
        question3: "What would you like to see improved in this course?",
        improvementInputPlaceholder: "Describe what you would like to see improved..."
    },
    fr: {
        pageTitle: "Réflexion de l'étudiant",
        greetingTitle: "Merci d'avoir pris le temps de réfléchir à ce cours !",
        greetingMessage: "Vos commentaires sont inestimables pour nous aider à améliorer nos cours et à mieux servir nos étudiants.",
        question1: "Quelle a été la partie la plus difficile du cours ?",
        challengeInputPlaceholder: "Décrivez la partie la plus difficile du cours...",
        question2: "Si vous ne deviez que dire une seule chose, qu'avez vous retenu de ce cours, s'il y'en a une?",
        keyTakeawayInputPlaceholder: "Décrivez votre une chose que vous avez retenu...",
        question3: "Qu'aimeriez-vous voir amélioré dans ce cours ?",
        improvementInputPlaceholder: "Décrivez ce que vous aimeriez voir amélioré..."
    },
    es: {
        pageTitle: "Reflexión del Estudiante",
        greetingTitle: "¡Gracias por tomarse el tiempo de reflexionar sobre este curso!",
        greetingMessage: "Sus comentarios son muy valiosos para ayudarnos a mejorar nuestros cursos y servir mejor a nuestros estudiantes.",
        question1: "¿Cuál fue la parte más desafiante del curso?",
        challengeInputPlaceholder: "Describa la parte más desafiante del curso...",
        question2: "Si tuviera que decir sólo una cosa, ¿qué se ha aprendido del curso, si es que se ha aprendido algo?",
        keyTakeawayInputPlaceholder: "Describa una cosa que ha aprendido...",
        question3: "¿Qué le gustaría que se mejorara en este curso?",
        improvementInputPlaceholder: "Describa lo que le gustaría que se mejorara..."
    }
};

const pageTitle = document.getElementById('pageTitle');
const languageSwitcher = document.getElementById('languageSwitcher');
const greetingTitle = document.getElementById('greetingTitle');
const greetingMessage = document.getElementById('greetingMessage');
const question1 = document.getElementById('question1');
const challengeInput = document.getElementById('challengeInput'); 
const question2 = document.getElementById('question2');
const keyTakeawayInput = document.getElementById('keyTakeawayInput'); 
const question3 = document.getElementById('question3');
const improvementInput = document.getElementById('improvementInput'); 

function setLanguage(langCode) {
    const currentTranslations = translations[langCode];

    if (!currentTranslations) {
        console.warn(`Translations for language code "${langCode}" not found.`);
        return; 
    }

    pageTitle.textContent = currentTranslations.pageTitle;
    greetingTitle.textContent = currentTranslations.greetingTitle;
    greetingMessage.textContent = currentTranslations.greetingMessage;
    question1.textContent = currentTranslations.question1;
    question2.textContent = currentTranslations.question2;
    question3.textContent = currentTranslations.question3;

    challengeInput.placeholder = currentTranslations.challengeInputPlaceholder;
    keyTakeawayInput.placeholder = currentTranslations.keyTakeawayInputPlaceholder;
    improvementInput.placeholder = currentTranslations.improvementInputPlaceholder;
}

const initialLang = localStorage.getItem('selectedLanguage') || 'en';
languageSwitcher.value = initialLang;
setLanguage(initialLang);

languageSwitcher.addEventListener('change', (event) => {
    const selectedLang = event.target.value;
    setLanguage(selectedLang);
    localStorage.setItem('selectedLanguage', selectedLang);
});
