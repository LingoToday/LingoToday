// Gender detection utility based on first names
// Returns 'male', 'female', or 'neutral' based on the user's first name

interface GenderData {
  male: string[];
  female: string[];
}

// Common Italian names by gender
const italianNames: GenderData = {
  male: [
    'Alessandro', 'Andrea', 'Antonio', 'Carlo', 'Claudio', 'Diego', 'Fabio', 'Francesco', 
    'Gianluca', 'Giovanni', 'Giuseppe', 'Luca', 'Luigi', 'Marco', 'Matteo', 'Michele', 
    'Paolo', 'Roberto', 'Stefano', 'Vincenzo', 'Lorenzo', 'Davide', 'Simone', 'Federico',
    'Riccardo', 'Andrea', 'Cristian', 'Daniele', 'Emanuele', 'Enrico', 'Filippo'
  ],
  female: [
    'Alessandra', 'Anna', 'Antonella', 'Chiara', 'Claudia', 'Elena', 'Elisabetta', 'Federica',
    'Francesca', 'Giorgia', 'Giulia', 'Laura', 'Maria', 'Martina', 'Paola', 'Roberta',
    'Sara', 'Silvia', 'Valentina', 'Veronica', 'Cristina', 'Daniela', 'Emanuela', 'Ilaria',
    'Jessica', 'Monica', 'Nicoletta', 'Patrizia', 'Serena', 'Simona', 'Stefania'
  ]
};

// Common international names by gender
const internationalNames: GenderData = {
  male: [
    'Alexander', 'Andrew', 'Anthony', 'Benjamin', 'Christopher', 'Daniel', 'David', 'Edward',
    'James', 'John', 'Joseph', 'Matthew', 'Michael', 'Nicholas', 'Paul', 'Peter', 'Robert',
    'Stephen', 'Thomas', 'William', 'Alex', 'Ben', 'Chris', 'Dan', 'Dave', 'Ed', 'Jim',
    'Joe', 'Matt', 'Mike', 'Nick', 'Rob', 'Steve', 'Tom', 'Will', 'Ryan', 'Kevin', 'Mark',
    'Jason', 'Brian', 'Josh', 'Adam', 'Justin', 'Sean', 'Eric', 'Aaron', 'Ian', 'Noah',
    'Mason', 'Lucas', 'Owen', 'Henry', 'Jack', 'Luke', 'Sam', 'Max', 'Leo', 'Carlos',
    'Fernando', 'Diego', 'Miguel', 'Jorge', 'Luis', 'Manuel', 'José', 'Pablo', 'Rafael'
  ],
  female: [
    'Alexandra', 'Amanda', 'Andrea', 'Angela', 'Anna', 'Ashley', 'Barbara', 'Betty',
    'Carol', 'Catherine', 'Christine', 'Deborah', 'Dorothy', 'Elizabeth', 'Emily', 'Helen',
    'Jennifer', 'Jessica', 'Karen', 'Laura', 'Linda', 'Lisa', 'Margaret', 'Maria', 'Mary',
    'Michelle', 'Nancy', 'Patricia', 'Rebecca', 'Ruth', 'Sandra', 'Sarah', 'Sharon', 'Susan',
    'Alex', 'Amy', 'Beth', 'Kate', 'Kim', 'Lisa', 'Emma', 'Olivia', 'Sophia', 'Isabella',
    'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Grace', 'Victoria',
    'Zoe', 'Lily', 'Hannah', 'Sofia', 'Ana', 'Carmen', 'Lucia', 'Valentina', 'Camila'
  ]
};

/**
 * Detects gender based on first name
 * @param firstName - The user's first name
 * @returns 'male', 'female', or 'neutral'
 */
export function detectGender(firstName: string): 'male' | 'female' | 'neutral' {
  if (!firstName || typeof firstName !== 'string') {
    return 'neutral';
  }

  // Normalize the name - trim whitespace and convert to proper case
  const normalizedName = firstName.trim();
  const properCaseName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase();

  // Check Italian names first (for context)
  if (italianNames.male.includes(properCaseName)) {
    return 'male';
  }
  if (italianNames.female.includes(properCaseName)) {
    return 'female';
  }

  // Check international names
  if (internationalNames.male.includes(properCaseName)) {
    return 'male';
  }
  if (internationalNames.female.includes(properCaseName)) {
    return 'female';
  }

  // For unrecognized names, return neutral as fallback
  return 'neutral';
}

/**
 * Get the appropriate video option based on detected gender
 * @param firstName - The user's first name
 * @param videoOptions - Array of video options with label and video_url
 * @returns The selected video option or the neutral option as fallback
 */
export function selectVideoByGender(firstName: string, videoOptions: Array<{label: string, video_url: string, answer_prompt: string, expected_answers: string[]}>) {
  const detectedGender = detectGender(firstName);
  
  // Try to find exact match
  const genderMapping = {
    'male': 'Male',
    'female': 'Female', 
    'neutral': 'Neutral'
  };
  
  const targetLabel = genderMapping[detectedGender];
  const selectedOption = videoOptions.find(option => option.label === targetLabel);
  
  // If no exact match, fallback to neutral, then first option
  if (selectedOption) {
    return selectedOption;
  }
  
  const neutralOption = videoOptions.find(option => option.label === 'Neutral');
  if (neutralOption) {
    return neutralOption;
  }
  
  // Ultimate fallback - return first option
  return videoOptions[0] || null;
}