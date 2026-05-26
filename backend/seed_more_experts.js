const db = require('./database');

const additionalExperts = [
    // Category 1: Maladies des plantes (Needs 4 more)
    { category_id: 1, full_name_fr: "Dr. Imane Berrada", full_name_ar: "د. إيمان برادة", spec_fr: "Pathologie végétale", spec_ar: "أمراض النباتات", bio_fr: "Spécialiste en diagnostic précoce des maladies fongiques.", bio_ar: "متخصصة في التشخيص المبكر للأمراض الفطرية.", exp: 8, rating: 4.8 },
    { category_id: 1, full_name_fr: "Pr. Nadia Chraibi", full_name_ar: "أ. نادية الشرايبي", spec_fr: "Virologie agricole", spec_ar: "علم الفيروسات الزراعية", bio_fr: "Experte en virus et bactéries affectant les cultures.", bio_ar: "خبيرة في الفيروسات والبكتيريا التي تصيب المحاصيل.", exp: 15, rating: 4.9 },
    { category_id: 1, full_name_fr: "Ing. Hajar El Fassi", full_name_ar: "م. هاجر الفاسي", spec_fr: "Traitement phytosanitaire", spec_ar: "المعالجة الصحية النباتية", bio_fr: "Consultante en traitements écologiques des maladies.", bio_ar: "مستشارة في العلاجات البيئية للأمراض.", exp: 6, rating: 4.6 },
    { category_id: 1, full_name_fr: "Dr. Karim Tazi", full_name_ar: "د. كريم التازي", spec_fr: "Épidémiologie végétale", spec_ar: "علم الأوبئة النباتية", bio_fr: "Prévention et gestion des épidémies dans les serres.", bio_ar: "الوقاية وإدارة الأوبئة في البيوت المحمية.", exp: 11, rating: 4.7 },

    // Category 2: Irrigation (Needs 4 more)
    { category_id: 2, full_name_fr: "Ing. Hamza Alaoui", full_name_ar: "م. حمزة العلوي", spec_fr: "Goutte à goutte & Micro-irrigation", spec_ar: "الري بالتنقيط", bio_fr: "Conception de systèmes d'irrigation économes en eau.", bio_ar: "تصميم أنظمة ري موفرة للمياه.", exp: 9, rating: 4.8 },
    { category_id: 2, full_name_fr: "Dr. Omar Bennani", full_name_ar: "د. عمر بناني", spec_fr: "Hydraulique agricole", spec_ar: "الهيدروليكا الزراعية", bio_fr: "Gestion des ressources hydriques pour les grandes fermes.", bio_ar: "إدارة الموارد المائية للمزارع الكبيرة.", exp: 14, rating: 4.9 },
    { category_id: 2, full_name_fr: "Ing. Salma El Amrani", full_name_ar: "م. سلمى العمراني", spec_fr: "Automatisation de l'irrigation", spec_ar: "أتمتة الري", bio_fr: "Intégration de capteurs pour l'irrigation intelligente.", bio_ar: "دمج أجهزة الاستشعار للري الذكي.", exp: 5, rating: 4.7 },
    { category_id: 2, full_name_fr: "Pr. Hassan Tazi", full_name_ar: "أ. حسن التازي", spec_fr: "Pompage solaire", spec_ar: "الضخ بالطاقة الشمسية", bio_fr: "Solutions de pompage basées sur l'énergie solaire.", bio_ar: "حلول الضخ المعتمدة على الطاقة الشمسية.", exp: 12, rating: 4.8 },

    // Category 3: Sol et fertilisation (Needs 4 more)
    { category_id: 3, full_name_fr: "Dr. Yassine El Fassi", full_name_ar: "د. ياسين الفاسي", spec_fr: "Microbiologie du sol", spec_ar: "أحياء التربة الدقيقة", bio_fr: "Analyse et amélioration du microbiome du sol.", bio_ar: "تحليل وتحسين ميكروبيوم التربة.", exp: 10, rating: 4.7 },
    { category_id: 3, full_name_fr: "Ing. Meriem Bennani", full_name_ar: "م. مريم بناني", spec_fr: "Fertilisation organique", spec_ar: "التسميد العضوي", bio_fr: "Programmes de fertilisation pour l'agriculture biologique.", bio_ar: "برامج التسميد للزراعة العضوية.", exp: 7, rating: 4.6 },
    { category_id: 3, full_name_fr: "Pr. Rachid Alaoui", full_name_ar: "أ. رشيد العلوي", spec_fr: "Chimie du sol", spec_ar: "كيمياء التربة", bio_fr: "Correction du pH et de la salinité des sols.", bio_ar: "تصحيح درجة الحموضة وملوحة التربة.", exp: 18, rating: 4.9 },
    { category_id: 3, full_name_fr: "Dr. Amina Zahrani", full_name_ar: "د. أمينة الزهراني", spec_fr: "Nutrition végétale", spec_ar: "تغذية النباتات", bio_fr: "Optimisation de l'absorption des nutriments.", bio_ar: "تحسين امتصاص العناصر الغذائية.", exp: 13, rating: 4.8 },

    // Category 4: Ravageurs et insectes (Needs 4 more)
    { category_id: 4, full_name_fr: "Ing. Tariq Chraibi", full_name_ar: "م. طارق الشرايبي", spec_fr: "Lutte biologique", spec_ar: "المكافحة البيولوجية", bio_fr: "Utilisation des insectes prédateurs pour protéger les cultures.", bio_ar: "استخدام الحشرات المفترسة لحماية المحاصيل.", exp: 8, rating: 4.8 },
    { category_id: 4, full_name_fr: "Dr. Sanae Tazi", full_name_ar: "د. سناء التازي", spec_fr: "Entomologie agricole", spec_ar: "علم الحشرات الزراعية", bio_fr: "Identification et cycle de vie des ravageurs.", bio_ar: "تحديد دورة حياة الآفات.", exp: 11, rating: 4.7 },
    { category_id: 4, full_name_fr: "Pr. Kamal El Amrani", full_name_ar: "أ. كمال العمراني", spec_fr: "Gestion intégrée des parasites", spec_ar: "الإدارة المتكاملة للآفات", bio_fr: "Stratégies IPM pour réduire l'usage des pesticides.", bio_ar: "استراتيجيات الإدارة المتكاملة للآفات لتقليل استخدام المبيدات.", exp: 16, rating: 4.9 },
    { category_id: 4, full_name_fr: "Ing. Fatima Berrada", full_name_ar: "م. فاطمة برادة", spec_fr: "Nématologie", spec_ar: "علم الديدان الأسطوانية", bio_fr: "Contrôle des nématodes dans les sols agricoles.", bio_ar: "مكافحة الديدان الأسطوانية في التربة الزراعية.", exp: 6, rating: 4.5 },

    // Category 5: Arbres fruitiers (Needs 3 more)
    { category_id: 5, full_name_fr: "Dr. Mourad Zahrani", full_name_ar: "د. مراد الزهراني", spec_fr: "Arboriculture oléicole", spec_ar: "زراعة الزيتون", bio_fr: "Expertise en production et taille des oliviers.", bio_ar: "خبرة في إنتاج وتقليم أشجار الزيتون.", exp: 14, rating: 4.8 },
    { category_id: 5, full_name_fr: "Ing. Leila Alaoui", full_name_ar: "م. ليلى العلوي", spec_fr: "Agrumes", spec_ar: "الحمضيات", bio_fr: "Amélioration des rendements des vergers d'agrumes.", bio_ar: "تحسين مردودية بساتين الحمضيات.", exp: 9, rating: 4.7 },
    { category_id: 5, full_name_fr: "Pr. Youssef El Fassi", full_name_ar: "أ. يوسف الفاسي", spec_fr: "Rosacées fruitières", spec_ar: "الورديات المثمرة", bio_fr: "Gestion des pommiers, poiriers et pruniers.", bio_ar: "إدارة أشجار التفاح والكمثرى والبرقوق.", exp: 20, rating: 4.9 },

    // Category 6: Légumes et cultures (Needs 4 more)
    { category_id: 6, full_name_fr: "Ing. Ahmed Berrada", full_name_ar: "م. أحمد برادة", spec_fr: "Maraîchage sous serre", spec_ar: "زراعة الخضروات في البيوت المحمية", bio_fr: "Optimisation de la production maraîchère.", bio_ar: "تحسين إنتاج الخضروات.", exp: 12, rating: 4.8 },
    { category_id: 6, full_name_fr: "Dr. Hind Chraibi", full_name_ar: "د. هند الشرايبي", spec_fr: "Cultures maraîchères", spec_ar: "زراعة الخضروات الحقلية", bio_fr: "Techniques de culture en plein champ.", bio_ar: "تقنيات الزراعة في الحقل المكشوف.", exp: 10, rating: 4.7 },
    { category_id: 6, full_name_fr: "Pr. Ali Tazi", full_name_ar: "أ. علي التازي", spec_fr: "Grandes cultures", spec_ar: "المحاصيل الكبرى", bio_fr: "Gestion des cultures céréalières et légumineuses.", bio_ar: "إدارة محاصيل الحبوب والبقوليات.", exp: 17, rating: 4.9 },
    { category_id: 6, full_name_fr: "Ing. Soukaina Bennani", full_name_ar: "م. سكينة بناني", spec_fr: "Agriculture hydroponique", spec_ar: "الزراعة المائية", bio_fr: "Spécialiste en cultures hors-sol.", bio_ar: "متخصصة في الزراعة بدون تربة.", exp: 5, rating: 4.6 },

    // Category 7: Agriculture intelligente (Needs 5 more)
    { category_id: 7, full_name_fr: "Dr. Yassir El Amrani", full_name_ar: "د. ياسر العمراني", spec_fr: "Agri-Tech & Drones", spec_ar: "التكنولوجيا الزراعية والدرونز", bio_fr: "Utilisation des drones pour le suivi des cultures.", bio_ar: "استخدام الطائرات بدون طيار لمراقبة المحاصيل.", exp: 7, rating: 4.8 },
    { category_id: 7, full_name_fr: "Ing. Zineb Zahrani", full_name_ar: "م. زينب الزهراني", spec_fr: "Agriculture de précision", spec_ar: "الزراعة الدقيقة", bio_fr: "Cartographie GPS et modulation de doses.", bio_ar: "رسم الخرائط باستخدام GPS وتعديل الجرعات.", exp: 6, rating: 4.7 },
    { category_id: 7, full_name_fr: "Pr. Mehdi Alaoui", full_name_ar: "أ. مهدي العلوي", spec_fr: "IoT Agricole", spec_ar: "إنترنت الأشياء الزراعي", bio_fr: "Réseaux de capteurs connectés pour fermes intelligentes.", bio_ar: "شبكات الاستشعار المتصلة للمزارع الذكية.", exp: 11, rating: 4.9 },
    { category_id: 7, full_name_fr: "Ing. Ibtissam Fassi", full_name_ar: "م. ابتسام الفاسي", spec_fr: "Analyse de données", spec_ar: "تحليل البيانات", bio_fr: "Big data et IA pour la prévision des rendements.", bio_ar: "البيانات الضخمة والذكاء الاصطناعي لتوقع الغلة.", exp: 4, rating: 4.5 },
    { category_id: 7, full_name_fr: "Dr. Reda Chraibi", full_name_ar: "د. رضا الشرايبي", spec_fr: "Systèmes d'aide à la décision", spec_ar: "أنظمة دعم القرار", bio_fr: "Développement de logiciels pour la gestion agricole.", bio_ar: "تطوير برمجيات لإدارة الزراعة.", exp: 9, rating: 4.8 }
];

const avatars = [
    "https://i.pravatar.cc/150?img=11",
    "https://i.pravatar.cc/150?img=12",
    "https://i.pravatar.cc/150?img=33",
    "https://i.pravatar.cc/150?img=44",
    "https://i.pravatar.cc/150?img=55",
    "https://i.pravatar.cc/150?img=66",
    "https://i.pravatar.cc/150?img=68"
];

async function seed() {
    console.log("Seeding additional experts...");
    try {
        for (let i = 0; i < additionalExperts.length; i++) {
            const exp = additionalExperts[i];
            const profile_image = null; // Do not seed avatars
            // Randomly set availability status to make it realistic
            const statuses = ['available', 'busy', 'offline'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const consultations = Math.floor(Math.random() * 150) + 10;
            
            // Check if already exists by full_name_fr
            const check = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM experts WHERE full_name_fr = ?", [exp.full_name_fr], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!check) {
                await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO experts (category_id, full_name, specialty, bio, full_name_fr, full_name_ar, specialty_fr, specialty_ar, bio_fr, bio_ar, experience_years, rating, profile_image, consultations_count, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [exp.category_id, exp.full_name_ar, exp.spec_ar, exp.bio_ar, exp.full_name_fr, exp.full_name_ar, exp.spec_fr, exp.spec_ar, exp.bio_fr, exp.bio_ar, exp.exp, exp.rating, profile_image, consultations, status],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
                console.log(`Inserted: ${exp.full_name_fr}`);
            } else {
                console.log(`Skipped: ${exp.full_name_fr} (Already exists)`);
            }
        }

        // Also update existing experts to have statuses and counts if they don't have them, but keep profile_image as null
        await new Promise((resolve, reject) => {
            db.run("UPDATE experts SET availability_status = 'available', consultations_count = 120 WHERE availability_status IS NULL", [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log("Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding experts:", error);
        process.exit(1);
    }
}

// wait a bit for db connection
setTimeout(() => {
    seed();
}, 1000);
