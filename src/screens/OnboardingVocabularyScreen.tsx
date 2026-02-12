import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import styles from '../styles/OnboardingStyles';

type VocabLevel = 'a1a2' | 'b1b2' | 'c1c2';

const vocabularyData: Record<string, Record<VocabLevel, string[]>> = {
  italian: {
    a1a2: ['ciao', 'grazie', 'per favore', 'sì', 'no', 'scusa', 'come stai?', 'bene', 'male', 'oggi', 'domani', 'ieri', 'acqua', 'pane', 'latte', 'caffè', 'vino', 'libro', 'scuola', 'lavoro', 'casa', 'auto', 'telefono', 'amico', 'famiglia', 'essere', 'sera', 'notte', 'numero', 'tempo'],
    b1b2: ['viaggio', 'biglietto', 'stazione', 'hotel', 'prenotare', 'soggiorno', 'colloquio di lavoro', 'curriculum', 'esperienza', 'azienda', 'ufficio', 'collega', 'riunione', 'documento', 'firma', 'inviare', 'ricevere', 'affittare', 'ricetta', 'medico', 'ospedale', 'farmacia', 'problema', 'soluzione', 'consiglio', 'dubbio', 'opinione', 'conversazione', 'ricerca', 'notizia'],
    c1c2: ['sfida', 'confronto', 'consapevolezza', 'sostenibilità', 'prospettiva', 'strategia', 'analisi', 'efficienza', 'sviluppo', 'valutazione', 'competenza', 'acquisizione', 'dinamica', 'contesto', 'paradosso', 'presupposto', 'impatto', 'ambiguità', 'interpretazione', 'integrazione', 'equilibrio', 'conseguenza', 'disponibilità', 'trasparenza', 'compromesso', 'legittimità', 'efficacia', 'rispettare', 'apprezzamento'],
  },
  spanish: {
    a1a2: ['hola', 'gracias', 'por favor', 'sí', 'no', 'perdón', '¿cómo estás?', 'bien', 'mal', 'hoy', 'mañana', 'ayer', 'agua', 'pan', 'leche', 'café', 'vino', 'libro', 'escuela', 'trabajo', 'casa', 'coche', 'teléfono', 'amigo', 'familia', 'ser', 'tarde', 'noche', 'número', 'tiempo'],
    b1b2: ['viaje', 'billete', 'estación', 'hotel', 'reservar', 'estancia', 'entrevista de trabajo', 'currículum', 'experiencia', 'empresa', 'oficina', 'colega', 'reunión', 'documento', 'firma', 'enviar', 'recibir', 'alquilar', 'receta', 'médico', 'hospital', 'farmacia', 'problema', 'solución', 'consejo', 'duda', 'opinión', 'conversación', 'investigación', 'noticia'],
    c1c2: ['desafío', 'comparación', 'conciencia', 'sostenibilidad', 'perspectiva', 'estrategia', 'análisis', 'eficiencia', 'desarrollo', 'evaluación', 'competencia', 'adquisición', 'dinámica', 'contexto', 'paradoja', 'requisito previo', 'impacto', 'ambigüedad', 'interpretación', 'integración', 'equilibrio', 'consecuencia', 'disponibilidad', 'transparencia', 'compromiso', 'legitimidad', 'eficacia', 'cumplir', 'reconocimiento'],
  },
  german: {
    a1a2: ['hallo', 'danke', 'bitte', 'ja', 'nein', 'entschuldigung', "wie geht's?", 'gut', 'schlecht', 'heute', 'morgen', 'gestern', 'wasser', 'brot', 'milch', 'kaffee', 'wein', 'buch', 'schule', 'arbeit', 'haus', 'auto', 'telefon', 'freund', 'familie', 'sein', 'abend', 'nacht', 'nummer', 'wetter'],
    b1b2: ['reise', 'fahrkarte', 'bahnhof', 'hotel', 'buchen', 'aufenthalt', 'vorstellungsgespräch', 'lebenslauf', 'erfahrung', 'firma', 'büro', 'kollege', 'besprechung', 'dokument', 'unterschrift', 'senden', 'empfangen', 'mieten', 'rezept', 'arzt', 'krankenhaus', 'apotheke', 'problem', 'lösung', 'ratschlag', 'zweifel', 'meinung', 'gespräch', 'forschung', 'nachricht'],
    c1c2: ['herausforderung', 'vergleich', 'bewusstsein', 'nachhaltigkeit', 'perspektive', 'strategie', 'analyse', 'effizienz', 'entwicklung', 'bewertung', 'kompetenz', 'erwerb', 'dynamik', 'kontext', 'paradoxon', 'voraussetzung', 'auswirkung', 'mehrdeutigkeit', 'interpretation', 'integration', 'gleichgewicht', 'folge', 'verfügbarkeit', 'transparenz', 'kompromiss', 'legitimität', 'wirksamkeit', 'einhalten', 'wertschätzung'],
  },
  french: {
    a1a2: ['bonjour', 'merci', "s'il te plaît", 'oui', 'non', 'pardon', 'ça va ?', 'bien', 'mal', "aujourd'hui", 'demain', 'hier', 'eau', 'pain', 'lait', 'café', 'vin', 'livre', 'école', 'travail', 'maison', 'voiture', 'téléphone', 'ami', 'famille', 'être', 'soir', 'nuit', 'numéro', 'météo'],
    b1b2: ['voyage', 'billet', 'gare', 'hôtel', 'réserver', 'séjour', "entretien d'embauche", 'CV', 'expérience', 'entreprise', 'bureau', 'collègue', 'réunion', 'document', 'signature', 'envoyer', 'recevoir', 'louer', 'ordonnance', 'médecin', 'hôpital', 'pharmacie', 'problème', 'solution', 'conseil', 'doute', 'opinion', 'conversation', 'recherche', 'nouvelle'],
    c1c2: ['défi', 'comparaison', 'conscience', 'durabilité', 'perspective', 'stratégie', 'analyse', 'efficacité', 'développement', 'évaluation', 'compétence', 'acquisition', 'dynamique', 'contexte', 'paradoxe', 'condition préalable', 'impact', 'ambiguïté', 'interprétation', 'intégration', 'équilibre', 'conséquence', 'disponibilité', 'transparence', 'compromis', 'légitimité', 'efficacité', 'respecter', 'appréciation'],
  },
};

const levelLabels: Record<VocabLevel, string> = {
  a1a2: 'A1-A2 Beginner Level',
  b1b2: 'B1-B2 Intermediate Level',
  c1c2: 'C1-C2 Advanced Level',
};

const OnboardingVocabularyScreen = ({ selectedLanguage, level, selectedWords, onToggle }: {
  selectedLanguage: string;
  level: VocabLevel;
  selectedWords: string[];
  onToggle: (word: string) => void;
}) => {
  const langKey = selectedLanguage || 'italian';
  const words = vocabularyData[langKey]?.[level] || vocabularyData.italian[level];

  return (
    <View style={styles.screenContent}>
      <Text style={styles.screenTitle}>
        Select all the words you know:
      </Text>
      <Text style={styles.vocabLevelIndicator}>
        {levelLabels[level]}
      </Text>

      <View style={styles.vocabWordGrid}>
        {words.map((word) => {
          const isSelected = selectedWords.includes(word);
          return (
            <TouchableOpacity
              key={word}
              onPress={() => onToggle(word)}
              style={[
                styles.vocabPill,
                isSelected && styles.vocabPillSelected,
              ]}
              testID={`button-vocab-${word}`}
            >
              <Text style={[
                styles.vocabPillText,
                isSelected && styles.vocabPillTextSelected,
              ]}>
                {word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default OnboardingVocabularyScreen;
