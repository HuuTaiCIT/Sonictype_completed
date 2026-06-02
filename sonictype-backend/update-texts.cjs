const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const NEWS_ARTICLES = [
	"The rapid evolution of artificial intelligence is fundamentally transforming how we interact with technology on a daily basis. From sophisticated natural language processing algorithms to advanced computer vision systems, machine learning models are becoming increasingly integrated into our digital infrastructure. This technological renaissance is not merely about automation; it represents a paradigm shift in human-computer collaboration. As we continue to push the boundaries of what is computationally possible, ethical considerations regarding data privacy and algorithmic bias must remain at the forefront of our developmental discourse. Developers and researchers are working tirelessly to ensure that these powerful tools are accessible, transparent, and beneficial to society as a whole, paving the way for a more connected and intelligent future where technology serves as an empowering extension of human capability.",
	"The exploration of deep space continues to captivate the imagination of scientists and astronomers around the world. Recent advancements in telescope technology have allowed us to observe distant galaxies with unprecedented clarity, revealing breathtaking cosmic phenomena that challenge our understanding of the universe. From massive black holes devouring entire star systems to the delicate dance of binary planets, the cosmos is a testament to the infinite possibilities of nature. As international space agencies collaborate on ambitious missions to establish permanent outposts on the moon and eventually send human explorers to Mars, we are entering a new era of interstellar discovery. This collective endeavor expands our scientific knowledge and unites humanity in a shared quest to uncover the profound mysteries hidden within the vast expanse of the cosmos.",
	"The preservation of ancient historical artifacts is crucial for understanding the complex tapestry of human civilization. Throughout history, diverse cultures have left behind remarkable architectural wonders, intricate tools, and captivating artistic expressions that provide invaluable insights into their daily lives and spiritual beliefs. Archaeologists and historians painstakingly excavate these remnants, employing cutting-edge techniques to analyze and date each discovery with remarkable precision. By studying these ancient relics, we can trace the evolutionary trajectory of societal development and appreciate the ingenuity of our ancestors. Furthermore, the meticulous documentation of cultural heritage serves as a powerful reminder of our shared origins, fostering a sense of global unity and mutual respect among different populations as we navigate the intricate challenges of the modern interconnected world.",
	"Advancements in modern medical science have significantly improved global life expectancy and overall quality of health. Researchers are constantly developing innovative treatments and targeted therapies that combat previously incurable diseases with remarkable efficacy. The integration of biotechnology and personalized medicine allows healthcare professionals to tailor interventions specifically to an individual's unique genetic makeup, maximizing therapeutic outcomes while minimizing adverse side effects. Additionally, the proliferation of wearable health monitoring devices empowers individuals to take proactive control of their well-being by tracking vital signs and physical activity in real-time. As we continue to unravel the complexities of the human body, the collaborative efforts of the global scientific community promise to eradicate pervasive health threats and usher in an unprecedented era of human vitality and longevity.",
	"The philosophical exploration of human consciousness remains one of the most profound and perplexing mysteries in both science and humanities. For centuries, brilliant thinkers have debated the intricate relationship between the physical brain and our subjective experience of reality. While neuroscientists can map complex neural pathways and identify specific brain regions responsible for various cognitive functions, the qualitative essence of feeling and perception continues to elude empirical measurement. This fascinating dichotomy challenges us to reconsider the fundamental nature of existence and our place within the universe. Engaging in mindful introspection allows individuals to cultivate a deeper awareness of their internal landscape, fostering emotional resilience and psychological well-being as they navigate the chaotic demands of contemporary society with grace and clarity."
];

async function update() {
  try {
    console.log("Deleting old texts...");
    await pool.query('DELETE FROM "RaceText"');
    
    console.log("Seeding new texts...");
    for (const text of NEWS_ARTICLES) {
        await pool.query('INSERT INTO "RaceText" ("id", "content") VALUES (gen_random_uuid(), $1)', [text]);
    }
    
    console.log("Success! Texts updated.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

update();
