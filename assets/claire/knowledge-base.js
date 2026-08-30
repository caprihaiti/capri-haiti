/*
 * CAPRI — Base de connaissances de Claire Heureuse
 * ==================================================
 * Chaque entrée représente UN sujet que Claire peut expliquer de façon fiable.
 * - "keywords" : mots/expressions (français ET créole haïtien mélangés) qui,
 *   trouvés dans la question du visiteur, désignent ce sujet. Ne pas mettre
 *   d'accents obligatoires : le moteur (engine.js) normalise le texte avant
 *   comparaison (minuscules, accents retirés).
 * - "fr" / "ht" : la réponse dans chaque langue. Les deux doivent dire
 *   exactement la même chose — seule la langue change.
 *
 * RÈGLE D'OR : on n'ajoute ici que des informations qui existent réellement
 * dans le site public de CAPRI ou dans le Document-Cadre institutionnel.
 * On n'invente ni tarif, ni partenariat, ni engagement contractuel, ni
 * décision officielle. Pour enrichir Claire plus tard, il suffit d'ajouter
 * de nouvelles entrées à ce tableau — aucun autre fichier n'a besoin d'être
 * modifié (voir engine.js et le README-claire.md du même dossier).
 */
window.CAPRI_KB = [

  // ---------- IDENTITÉ / MISSION / VISION ----------
  {
    id: "identite",
    keywords: ["qu'est-ce que capri", "qu'est ce que capri", "qui etes vous", "qui est capri", "kisa capri ye", "c'est quoi capri", "kimoun capri ye", "sa se ki capri", "presentation de capri", "prezantasyon capri",
      "parle-moi de capri", "parlez-moi de capri", "parle moi de capri", "parlez moi de capri", "parle-moi de cpri", "parle moi de cpri",
      "dis-moi ce qu'est capri", "dis moi ce qu'est capri", "explique-moi capri", "explique moi capri", "decris capri", "decris-moi capri",
      "en savoir plus sur capri", "informations sur capri", "information sur capri", "info sur capri", "capri en bref", "resume capri", "presente capri", "presente-moi capri",
      "pale m de capri", "pale m sou capri", "esplike m capri", "esplike m sou capri", "enfòmasyon sou capri", "enfomasyon sou capri", "plis enfo sou capri"],
    fr: "CAPRI — Centre d'Appui à la Performance et au Renforcement Institutionnel — est un organisme indépendant spécialisé dans l'appui, la modernisation et le renforcement des institutions publiques haïtiennes. Sa signature : « Renforcer les institutions. Accroître la capacité de l'État. »",
    ht: "CAPRI — Sant Apui pou Pèfòmans ak Ranfòsman Enstitisyonèl — se yon òganis endepandan ki espesyalize nan apiye, mòdènize ak ranfòse enstitisyon piblik ayisyen yo. Slogan li: « Ranfòse enstitisyon yo. Ogmante kapasite Leta a. »"
  },
  {
    id: "mission",
    keywords: ["mission", "misyon", "objectif de capri", "pou ki rezon capri egziste"],
    fr: "La mission de CAPRI est d'accompagner les institutions publiques haïtiennes dans le renforcement durable de leurs capacités institutionnelles, organisationnelles, administratives et opérationnelles, afin d'améliorer leur performance et la qualité des services rendus à la population.",
    ht: "Misyon CAPRI se akonpaye enstitisyon piblik ayisyen yo pou yo ranfòse kapasite enstitisyonèl, òganizasyonèl, administratif ak operasyonèl yo yon fason dirab, pou amelyore pèfòmans yo ak kalite sèvis yo bay popilasyon an."
  },
  {
    id: "vision",
    keywords: ["vision", "vizyon", "ambition de capri"],
    fr: "La vision de CAPRI : des institutions publiques fortes, performantes et durables, au service de la population et du développement d'Haïti.",
    ht: "Vizyon CAPRI: enstitisyon piblik ki fò, ki pèfòmant e ki dirab, k ap sèvi popilasyon an ak devlopman Ayiti."
  },
  {
    id: "valeurs",
    keywords: ["valeurs", "valè", "principes de capri", "ki jan capri travay sou valè"],
    fr: "CAPRI fonde son action sur 8 valeurs : intégrité, professionnalisme, efficience, culture du résultat, responsabilité, continuité institutionnelle, adaptation et transmission des compétences.",
    ht: "CAPRI baze aksyon li sou 8 valè: entegrite, pwofesyonalis, efikasite, kilti rezilta, responsablite, kontinyite enstitisyonèl, adaptasyon ak transmisyon konpetans."
  },
  {
    id: "renforcement_institutionnel",
    keywords: ["renforcement institutionnel", "ranfòsman enstitisyonèl", "qu'est-ce que le renforcement institutionnel", "c'est quoi le renforcement institutionnel"],
    fr: "Le renforcement institutionnel consiste à accroître durablement la capacité d'une institution à accomplir sa mission : cadre juridique, organisation, personnel, procédures, outils, systèmes, coordination, contrôle et performance. CAPRI ne fait pas le travail à la place de l'institution ; il l'aide à devenir capable de mieux faire par elle-même.",
    ht: "Ranfòsman enstitisyonèl la se ogmante dirab kapasite yon enstitisyon pou l akonpli misyon li: kad jiridik, òganizasyon, pèsonèl, pwosedi, zouti, sistèm, kowòdinasyon, kontwòl ak pèfòmans. CAPRI pa fè travay la nan plas enstitisyon an; li ede l vin kapab fè pi byen pou kont li."
  },
  {
    id: "champs_intervention",
    keywords: ["domaines d'intervention", "domèn entèvansyon", "champs d'intervention", "champs strategiques", "dans quels domaines intervenez vous", "kilès domèn"],
    fr: "CAPRI couvre 10 champs stratégiques : Justice et État de droit, Sécurité intérieure et renseignement, Police Nationale, Immigration/frontières/douanes, Administration territoriale, État civil/identité/archives, Transformation numérique de l'État, Gouvernance et intégrité, Appui parlementaire, Gouvernance électorale — ainsi que 15 secteurs (éducation, santé, agriculture, énergie, etc.). Consultez la page « Champs d'intervention » du site pour le détail complet.",
    ht: "CAPRI kouvri 10 domèn estratejik: Jistis ak Eta de dwa, Sekirite enteryè ak ranseyman, Polis Nasyonal, Imigrasyon/fwontyè/dwan, Administrasyon teritoryal, Eta sivil/idantite/achiv, Transfòmasyon nimerik Leta, Gouvènans ak entegrite, Apui palmantè, Gouvènans elektoral — ansanm ak 15 sektè (edikasyon, sante, agrikilti, eneji, elt.). Konsilte paj « Champs d'intervention » sit la pou detay konplè."
  },
  {
    id: "ce_que_capri_nest_pas",
    keywords: ["capri se yon", "capri n'est pas", "capri pa se", "parti politik", "parti politique", "structure electorale", "force de securite", "capri gen pouvwa"],
    fr: "CAPRI n'est ni un parti politique, ni une structure électorale, ni une administration parallèle, ni une autorité de contrôle de l'État, ni une juridiction, ni une force de sécurité. C'est un centre d'expertise qui appuie les institutions sans se substituer aux autorités légalement compétentes.",
    ht: "CAPRI pa yon pati politik, ni yon estrikti elektoral, ni yon administrasyon paralèl, ni yon otorite kontwòl Leta, ni yon jiridiksyon, ni yon fòs sekirite. Se yon sant ekspètiz ki apiye enstitisyon yo san li pa ranplase otorite ki gen konpetans legal yo."
  },

  // ---------- INSTITUTIONS ACCOMPAGNÉES ----------
  {
    id: "institutions_publiques",
    keywords: ["quelles institutions", "ki enstitisyon", "travaillez avec quelles institutions", "administration centrale", "organismes autonomes", "clients de capri"],
    fr: "CAPRI intervient auprès des institutions de l'administration centrale (ministères, organismes autonomes de l'État) ainsi qu'auprès des collectivités territoriales : Délégations, Vice-délégations, Mairies, CASEC, ASEC et autres structures publiques territoriales.",
    ht: "CAPRI entèvni bò kote enstitisyon administrasyon santral yo (ministè, òganis otonòm Leta), ansanm ak kolektivite teritoryal yo: Delegasyon, Vis-delegasyon, Meri, CASEC, ASEC ak lòt estrikti piblik teritoryal."
  },
  {
    id: "delegations_vice_delegations",
    keywords: ["delegation", "delegasyon", "vice-delegation", "vis-delegasyon", "capri travaille avec les delegations", "eske capri travay ak delegasyon"],
    fr: "Les Délégations et Vice-délégations sont des bénéficiaires prioritaires de l'action de CAPRI. Dans le cadre d'un accord ou d'un mécanisme de coopération établi avec le Ministère de l'Intérieur et des Collectivités territoriales (MICT) — leur autorité de tutelle — les interventions de CAPRI pourront bénéficier aux Délégations, Vice-délégations, administrations communales, Conseils de Sections communales (CASEC) et Assemblées de Sections communales (ASEC). Ce sont des bénéficiaires et des terrains de mise en œuvre, pas des partenaires institutionnels directs de CAPRI.",
    ht: "Delegasyon ak Vis-delegasyon yo se benefisyè priyoritè aksyon CAPRI. Nan kad yon akò oswa yon mekanis kolaborasyon ki etabli ak Ministè Enteryè ak Kolektivite Teritoryal yo (MICT) — otorite tutèl yo — entèvansyon CAPRI yo ka benefisye Delegasyon, Vis-delegasyon, administrasyon komin, Konsèy Seksyon Kominal (CASEC) ak Asanble Seksyon Kominal (ASEC). Se benefisyè ak teren aplikasyon, pa patnè enstitisyonèl dirèk CAPRI."
  },
  {
    id: "collectivites_territoriales",
    keywords: ["collectivites territoriales", "kolektivite teritoryal", "mairie", "meri", "casec", "asec", "commune", "komin"],
    fr: "CAPRI accompagne les collectivités territoriales — Mairies, CASEC, ASEC — dans le diagnostic territorial, le renforcement administratif, la professionnalisation des personnels et la mise en réseau territorial, toujours en coordination avec le MICT.",
    ht: "CAPRI akonpaye kolektivite teritoryal yo — Meri, CASEC, ASEC — nan dyagnostik teritoryal, ranfòsman administratif, pwofesyonalizasyon pèsonèl yo ak mizanrezo teritoryal, toujou an kowòdinasyon ak MICT."
  },
  {
    id: "ministeres_organismes",
    keywords: ["ministere", "ministè", "organisme autonome", "capri travaille avec quel ministere"],
    fr: "CAPRI peut accompagner les ministères et organismes autonomes de l'État dans le diagnostic institutionnel, la modernisation administrative, la formation, la conception d'outils et le suivi-évaluation — sans jamais se substituer à leurs missions propres.",
    ht: "CAPRI ka akonpaye ministè yo ak òganis otonòm Leta yo nan dyagnostik enstitisyonèl, mòdènizasyon administratif, fòmasyon, konsepsyon zouti ak suivi-evalyasyon — san li pa janm ranplase misyon pwòp yo."
  },

  // ---------- SERVICES ----------
  {
    id: "services",
    keywords: ["services", "ki sèvis", "que faites vous", "ki sa capri ofri", "quels services propose capri", "que propose capri", "activites de capri"],
    fr: "CAPRI propose notamment : diagnostic institutionnel, formation et professionnalisation, création d'outils institutionnels, accompagnement post-formation (30/60/90 jours), analyse juridique et réforme, études comparatives internationales, transformation numérique, appui parlementaire et gouvernance électorale.",
    ht: "CAPRI ofri pami lòt bagay: dyagnostik enstitisyonèl, fòmasyon ak pwofesyonalizasyon, kreyasyon zouti enstitisyonèl, akonpayman apre fòmasyon (30/60/90 jou), analiz jiridik ak refòm, etid konparatif entènasyonal, transfòmasyon nimerik, apui palmantè ak gouvènans elektoral."
  },
  {
    id: "methode_approche",
    keywords: ["methode", "metòd", "approche", "quelle est votre methode", "12 mouvements", "comment travaillez vous", "kijan capri travay"],
    fr: "La méthode CAPRI suit 12 mouvements : connaître, diagnostiquer, mesurer, expliquer, comparer, adapter, préparer, former, tester, implémenter, évaluer et transférer. Elle repose sur des principes directeurs comme « diagnostiquer avant de réformer », « comparer avant d'inventer » et « tester avant de généraliser ».",
    ht: "Metòd CAPRI a swiv 12 mouvman: konnen, dyagnostike, mezire, eksplike, konpare, adapte, prepare, fòme, teste, aplike, evalye ak transfere. Li baze sou prensip dirèktè tankou « dyagnostike anvan w refòme », « konpare anvan w envante » ak « teste anvan w jeneralize »."
  },
  {
    id: "diagnostic",
    keywords: ["diagnostic", "dyagnostik", "evaluation institutionnelle", "evalyasyon"],
    fr: "Le diagnostic institutionnel examine l'organisation, les procédures, les compétences et les besoins d'une institution afin de produire une cartographie précise et un plan d'action mesurable — la première étape de toute intervention CAPRI.",
    ht: "Dyagnostik enstitisyonèl la egzamine òganizasyon, pwosedi, konpetans ak bezwen yon enstitisyon pou pwodwi yon katografi presi ak yon plan aksyon ki mezirab — premye etap nan tout entèvansyon CAPRI."
  },
  {
    id: "formation",
    keywords: ["formation", "fòmasyon", "seminaire", "seminè", "atelier", "plenieres", "pleniè"],
    fr: "CAPRI conçoit des séminaires, formations spécialisées, ateliers pratiques et travaux en séances plénières pour cadres et agents publics : administration, rédaction, éthique, gestion, planification, suivi-évaluation.",
    ht: "CAPRI konsevwa seminè, fòmasyon espesyalize, atelye pratik ak travay nan seyans plenyè pou kad ak ajan piblik: administrasyon, redaksyon, etik, jesyon, planifikasyon, suivi-evalyasyon."
  },
  {
    id: "outils",
    keywords: ["outils", "zouti", "manuel de procedures", "fiche de poste", "organigramme", "tableau de bord"],
    fr: "CAPRI conçoit des outils institutionnels concrets : manuels de procédures, fiches de poste, organigrammes, tableaux de bord, matrices de suivi, indicateurs de performance et modèles de rapports.",
    ht: "CAPRI konsevwa zouti enstitisyonèl konkrè: manyèl pwosedi, fich pòs, òganigram, tablo bò, matris suivi, endikatè pèfòmans ak modèl rapò."
  },
  {
    id: "plan_action_suivi",
    keywords: ["plan d'action", "plan aksyon", "implementation", "suivi", "30 60 90", "accompagnement post formation", "cycle capri"],
    fr: "CAPRI n'intervient jamais sans suivi : après la formation, l'application des acquis est mesurée à 30, 60 et 90 jours (puis 6 et 12 mois), avec correction des faiblesses et documentation des résultats. Le Cycle CAPRI : diagnostic → plan d'action → formation → outils → implémentation → suivi → résultats → ajustement.",
    ht: "CAPRI pa janm entèvni san suivi: apre fòmasyon an, aplikasyon akizisyon yo mezire nan 30, 60 ak 90 jou (epi 6 ak 12 mwa), ak koreksyon feblès yo ak dokimantasyon rezilta yo. Sik CAPRI a: dyagnostik → plan aksyon → fòmasyon → zouti → aplikasyon → suivi → rezilta → ajisteman."
  },
  {
    id: "analyse_comparative",
    keywords: ["analyse comparative", "analiz konparativ", "modeles institutionnels", "etude comparative", "comparer avec d'autres pays"],
    fr: "CAPRI analyse les modèles institutionnels existants ailleurs, mesure leurs résultats et propose des modèles adaptés aux réalités haïtiennes — jamais transposés automatiquement. La décision finale reste toujours celle des autorités publiques haïtiennes.",
    ht: "CAPRI analize modèl enstitisyonèl ki egziste lòt kote, mezire rezilta yo epi pwopoze modèl ki adapte ak reyalite ayisyen yo — yo pa janm transpoze otomatikman. Desizyon final la toujou rete responsablite otorite piblik ayisyen yo."
  },
  {
    id: "projets_pilotes",
    keywords: ["projet pilote", "pwojè pilòt", "phase pilote", "experimentation"],
    fr: "Avant toute généralisation, CAPRI privilégie une phase pilote : tester un modèle dans un environnement réel (un service, une institution, une commune), mesurer les résultats, corriger, puis seulement recommander une généralisation.",
    ht: "Anvan nenpòt jeneralizasyon, CAPRI prefere yon faz pilòt: teste yon modèl nan yon anviwònman reyèl (yon sèvis, yon enstitisyon, yon komin), mezire rezilta yo, korije, epi sèlman apre rekòmande yon jeneralizasyon."
  },
  {
    id: "analyse_juridique_reforme",
    keywords: ["analyse juridique", "analiz jiridik", "reforme", "refòm", "proposition de loi", "avant-projet de loi", "pwojè lwa"],
    fr: "CAPRI analyse le cadre juridique (Constitution, lois, décrets, règlements) au regard de son application réelle, et peut soumettre des propositions de réforme : projets de décrets, projets d'arrêtés, avant-projets de loi et notes explicatives — lorsque cela relève de son mandat d'appui technique aux autorités compétentes.",
    ht: "CAPRI analize kad jiridik la (Konstitisyon, lwa, dekrè, règleman) an rapò ak aplikasyon reyèl li, epi li ka soumèt pwopozisyon refòm: pwojè dekrè, pwojè arete, avan-pwojè lwa ak nòt eksplikatif — lè sa fè pati mandat apui teknik li bay otorite konpetan yo."
  },

  // ---------- COOPÉRATION ----------
  {
    id: "cooperation",
    keywords: ["cooperation", "koperasyon", "voyage d'etude", "vwayaj etid", "jumelage", "partenariat"],
    fr: "CAPRI développe des relations de coopération (échanges techniques, jumelages institutionnels, voyages d'études, observatoire international) avec des institutions haïtiennes et internationales dont le mandat correspond à sa mission. Ces institutions sont des interlocuteurs ciblés ou potentiels — leur mention ne signifie pas l'existence d'un partenariat déjà conclu.",
    ht: "CAPRI devlope relasyon koperasyon (echanj teknik, jimèlaj enstitisyonèl, vwayaj etid, obsèvatwa entènasyonal) ak enstitisyon ayisyen ak entènasyonal ki gen yon mandat ki koresponn ak misyon li. Enstitisyon sa yo se entèlokitè vize oswa potansyèl — mansyone yo pa vle di gen yon patenarya deja etabli."
  },

  // ---------- CHAMPS STRATÉGIQUES ----------
  {
    id: "justice",
    keywords: ["justice", "etat de droit", "eta de dwa", "tribunaux", "tribinal"],
    fr: "Dans le champ Justice et État de droit, CAPRI peut appuyer l'organisation des juridictions, l'administration judiciaire, la gestion des dossiers, la réduction des délais, l'accès à la justice, les statistiques et la digitalisation — toujours en appui technique, sans se substituer à l'autorité judiciaire.",
    ht: "Nan domèn Jistis ak Eta de dwa, CAPRI ka apiye òganizasyon jiridiksyon yo, administrasyon jidisyè, jesyon dosye, diminisyon dele, aksè a jistis, estatistik ak dijitalizasyon — toujou kòm apui teknik, san li pa ranplase otorite jidisyè a."
  },
  {
    id: "securite_interieure",
    keywords: ["securite interieure", "sekirite enteryè", "renseignement", "ranseyman"],
    fr: "CAPRI peut contribuer au renforcement institutionnel des organismes de sécurité publique et de renseignement stratégique (gouvernance, coordination interinstitutionnelle, modernisation administrative, formation). CAPRI n'exerce aucune activité opérationnelle de police, de renseignement ou de défense, et respecte la Constitution, les droits fondamentaux et les mécanismes de contrôle démocratique.",
    ht: "CAPRI ka kontribye nan ranfòsman enstitisyonèl òganis sekirite piblik ak ranseyman estratejik (gouvènans, kowòdinasyon enteinstitisyonèl, mòdènizasyon administratif, fòmasyon). CAPRI pa fè okenn aktivite operasyonèl polis, ranseyman oswa defans, e li respekte Konstitisyon an, dwa fondamantal yo ak mekanis kontwòl demokratik yo."
  },
  {
    id: "pnh_vetting",
    keywords: ["pnh", "police nationale", "vetting", "controle interne police"],
    fr: "Pour la Police Nationale d'Haïti, CAPRI peut appuyer l'organisation, le recrutement, la formation continue, le contrôle interne, l'évaluation des performances, le vetting institutionnel et la prévention de la corruption — en appui technique, jamais en substitution du commandement policier.",
    ht: "Pou Polis Nasyonal Ayiti a, CAPRI ka apiye òganizasyon, rekritman, fòmasyon kontinyèl, kontwòl entèn, evalyasyon pèfòmans, vetting enstitisyonèl ak prevansyon kòripsyon — kòm apui teknik, jamè kòm sibstitisyon kòmandman polis la."
  },
  {
    id: "immigration_frontieres_douane",
    keywords: ["immigration", "imigrasyon", "emigration", "emigrasyon", "frontiere", "fwontyè", "douane", "dwan", "passeport", "paspò"],
    fr: "Dans le champ Immigration, frontières et douanes, CAPRI peut appuyer la modernisation des institutions concernées : passeports, contrôle frontalier, systèmes d'information, procédures douanières et lutte contre la fraude.",
    ht: "Nan domèn Imigrasyon, fwontyè ak dwan, CAPRI ka apiye mòdènizasyon enstitisyon konsène yo: paspò, kontwòl fwontyè, sistèm enfòmasyon, pwosedi dwan ak lit kont fwod."
  },
  {
    id: "etat_civil_identite",
    keywords: ["etat civil", "eta sivil", "identite", "idantite", "acte de naissance", "ak nesans"],
    fr: "CAPRI peut appuyer la modernisation de la chaîne de l'état civil et de l'identité juridique unique, ainsi que l'interopérabilité des systèmes publics concernés.",
    ht: "CAPRI ka apiye mòdènizasyon chèn eta sivil la ak idantite jiridik inik la, ansanm ak entèwoperabilite sistèm piblik konsène yo."
  },
  {
    id: "archives_nationales",
    keywords: ["archives nationales", "achiv nasyonal", "gestion documentaire", "jesyon dokiman"],
    fr: "CAPRI peut appuyer la modernisation des Archives Nationales et la mise en place d'une politique nationale de gestion documentaire, afin que la mémoire administrative de l'État soit préservée.",
    ht: "CAPRI ka apiye mòdènizasyon Achiv Nasyonal yo ak enstalasyon yon politik nasyonal jesyon dokimantè, pou memwa administratif Leta a rete prezève."
  },
  {
    id: "interconnexion_services_publics",
    keywords: ["interconnexion", "entèkoneksyon", "transformation numerique", "transfòmasyon nimerik", "interoperabilite", "entèwoperabilite"],
    fr: "CAPRI accompagne la transformation numérique et l'interconnexion des services publics, selon le principe « une donnée, une source » : identité numérique, registres, plateforme d'interopérabilité, portail des services publics — en améliorant d'abord le processus avant de le numériser.",
    ht: "CAPRI akonpaye transfòmasyon nimerik ak entèkoneksyon sèvis piblik yo, selon prensip « yon done, yon sous »: idantite nimerik, rejis, platfòm entèwoperabilite, pòtay sèvis piblik — pandan y ap amelyore pwosesis la anvan yo dijitalize li."
  },
  {
    id: "systeme_penitentiaire",
    keywords: ["systeme penitentiaire", "sistèm penitansye", "prison", "detention", "detansyon"],
    fr: "Dans le système pénitentiaire, CAPRI peut appuyer l'informatisation, le dossier pénitentiaire numérique, le suivi de la détention préventive et la mise en réseau de la chaîne pénale (Police ↔ Parquet ↔ Tribunaux ↔ Administration pénitentiaire).",
    ht: "Nan sistèm penitansye a, CAPRI ka apiye enfòmatizasyon, dosye penitansye nimerik, suivi detansyon prevantif ak mizanrezo chèn penal la (Polis ↔ Pakè ↔ Tribinal ↔ Administrasyon penitansye)."
  },
  {
    id: "secteurs_supplementaires",
    keywords: ["education", "edikasyon", "sante", "sante piblik", "agriculture", "environnement", "energie", "eneji", "eau", "dlo", "finances publiques", "fonction publique", "fonksyon piblik", "decentralisation", "amenagement du territoire"],
    fr: "CAPRI peut intervenir dans 15 secteurs, notamment : éducation, santé publique, agriculture, environnement, infrastructures, énergie, eau et assainissement, finances publiques, économie, diplomatie, protection sociale, fonction publique, décentralisation, aménagement du territoire — toujours en appui transversal, sans se substituer aux ministères concernés.",
    ht: "CAPRI ka entèvni nan 15 sektè, tankou: edikasyon, sante piblik, agrikilti, anviwònman, enfrastrikti, enèji, dlo ak asenisman, finans piblik, ekonomi, diplomasi, pwoteksyon sosyal, fonksyon piblik, desantralizasyon, amenajman teritwa — toujou kòm apui transvèsal, san li pa ranplase ministè konsène yo."
  },

  // ---------- CONTACT ----------
  {
    id: "contact",
    keywords: ["contact", "kontak", "email", "imel", "telephone", "telefòn", "adresse", "adrès", "comment vous joindre", "kijan pou m kontakte"],
    fr: "Vous pouvez écrire à contact@capri-haiti.org, appeler CAPRI au +509 37 06 1335, ou ouvrir la page Contact du site pour utiliser le formulaire en ligne.",
    ht: "Ou ka ekri nan contact@capri-haiti.org, rele CAPRI nan +509 37 06 1335, oswa ouvri paj Kontak sit la pou itilize fòmilè an liy lan."
  },
  {
    id: "presenter_projet",
    keywords: ["presenter un projet", "prezante yon pwojè", "comment travailler avec capri", "kijan pou travay ak capri", "proposition de partenariat"],
    fr: "Pour présenter un projet ou une proposition de coopération, précisez l'institution concernée, le problème constaté, les résultats recherchés et vos coordonnées, puis écrivez à contact@capri-haiti.org, appelez CAPRI au +509 37 06 1335 ou consultez la page Contact.",
    ht: "Pou prezante yon pwojè oswa yon pwopozisyon koperasyon, presize enstitisyon konsène a, pwoblèm ki konstate a, rezilta w ap chèche yo ak kowòdone w, epi ekri nan contact@capri-haiti.org, rele CAPRI nan +509 37 06 1335 oswa konsilte paj Kontak la."
  },
];
