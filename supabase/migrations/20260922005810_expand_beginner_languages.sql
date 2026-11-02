-- Add beginner courses without changing existing concepts or learner records.

begin;

do $$ begin if not exists (select 1 from public.languages where code='en') then raise exception 'English source language is required'; end if; end $$;

insert into public.languages (code,name,speech_locale) values ('fr','French','fr-FR') on conflict (code) do update set name=excluded.name,speech_locale=excluded.speech_locale;

insert into public.units (language_id,slug,title,description,sort_order) select id,'french-foundations','French foundations','Fifteen greetings and everyday phrases. Polite forms are labelled.',0 from public.languages where code='fr' on conflict (language_id,slug) where slug is not null do update set title=excluded.title,description=excluded.description;

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-hello',u.id,1,0,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Hello',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-hello' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Bonjour',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-hello' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-good-evening',u.id,1,1,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Good evening',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-good-evening' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Bonsoir',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-good-evening' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-goodbye',u.id,1,2,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Goodbye',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-goodbye' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Au revoir',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-goodbye' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-thanks',u.id,1,3,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Thank you',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-thanks' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Merci',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-thanks' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-please',u.id,1,4,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Please (polite)',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-please' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'S’il vous plaît',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-please' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-yes',u.id,1,5,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Yes',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-yes' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Oui',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-yes' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-no',u.id,1,6,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'No',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-no' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Non',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-no' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-excuse-me',u.id,1,7,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Excuse me (polite)',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-excuse-me' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Excusez-moi',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-excuse-me' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-see-you-soon',u.id,1,8,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'See you soon',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-see-you-soon' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'À bientôt',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-see-you-soon' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-how-are-you',u.id,2,9,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'How are you? (polite)',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-how-are-you' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Comment allez-vous ?',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-how-are-you' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-fine',u.id,2,10,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I am well',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-fine' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Je vais bien',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-fine' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-my-name',u.id,2,11,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'My name is…',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-my-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Je m’appelle…',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-my-name' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-your-name',u.id,2,12,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'What is your name? (polite)',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-your-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Comment vous appelez-vous ?',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-your-name' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-not-understand',u.id,2,13,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I do not understand',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-not-understand' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Je ne comprends pas',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-not-understand' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'fr-foundations-speak-english',u.id,2,14,true from public.units u join public.languages l on l.id=u.language_id where l.code='fr' and u.slug='french-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Do you speak English? (polite)',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-speak-english' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Parlez-vous anglais ?',null from public.concepts c cross join public.languages l where c.slug='fr-foundations-speak-english' and l.code='fr' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.languages (code,name,speech_locale) values ('zh','Mandarin Chinese','zh-CN') on conflict (code) do update set name=excluded.name,speech_locale=excluded.speech_locale;

insert into public.units (language_id,slug,title,description,sort_order) select id,'mandarin-foundations','Mandarin foundations','Fifteen everyday phrases in simplified Chinese with pinyin.',0 from public.languages where code='zh' on conflict (language_id,slug) where slug is not null do update set title=excluded.title,description=excluded.description;

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-hello',u.id,1,0,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Hello',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-hello' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'你好','nǐ hǎo' from public.concepts c cross join public.languages l where c.slug='zh-foundations-hello' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-good-morning',u.id,1,1,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Good morning',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-good-morning' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'早上好','zǎoshang hǎo' from public.concepts c cross join public.languages l where c.slug='zh-foundations-good-morning' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-good-evening',u.id,1,2,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Good evening',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-good-evening' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'晚上好','wǎnshang hǎo' from public.concepts c cross join public.languages l where c.slug='zh-foundations-good-evening' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-goodbye',u.id,1,3,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Goodbye',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-goodbye' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'再见','zàijiàn' from public.concepts c cross join public.languages l where c.slug='zh-foundations-goodbye' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-thanks',u.id,1,4,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Thank you',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-thanks' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'谢谢','xièxie' from public.concepts c cross join public.languages l where c.slug='zh-foundations-thanks' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-welcome',u.id,1,5,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'You are welcome',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-welcome' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'不客气','bú kèqi' from public.concepts c cross join public.languages l where c.slug='zh-foundations-welcome' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-sorry',u.id,1,6,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Sorry',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-sorry' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'对不起','duìbuqǐ' from public.concepts c cross join public.languages l where c.slug='zh-foundations-sorry' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-no-problem',u.id,1,7,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'It is all right',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-no-problem' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'没关系','méi guānxi' from public.concepts c cross join public.languages l where c.slug='zh-foundations-no-problem' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-please',u.id,1,8,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Please',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-please' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'请','qǐng' from public.concepts c cross join public.languages l where c.slug='zh-foundations-please' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-excuse-me',u.id,2,9,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Excuse me (before a question)',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-excuse-me' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'请问','qǐngwèn' from public.concepts c cross join public.languages l where c.slug='zh-foundations-excuse-me' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-how-are-you',u.id,2,10,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'How are you?',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-how-are-you' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'你好吗？','nǐ hǎo ma' from public.concepts c cross join public.languages l where c.slug='zh-foundations-how-are-you' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-fine',u.id,2,11,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I am very well',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-fine' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'我很好','wǒ hěn hǎo' from public.concepts c cross join public.languages l where c.slug='zh-foundations-fine' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-my-name',u.id,2,12,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'My name is…',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-my-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'我叫……','wǒ jiào…' from public.concepts c cross join public.languages l where c.slug='zh-foundations-my-name' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-your-name',u.id,2,13,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'What is your name?',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-your-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'你叫什么名字？','nǐ jiào shénme míngzi' from public.concepts c cross join public.languages l where c.slug='zh-foundations-your-name' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'zh-foundations-not-understand',u.id,2,14,true from public.units u join public.languages l on l.id=u.language_id where l.code='zh' and u.slug='mandarin-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I do not understand (what I hear)',null from public.concepts c cross join public.languages l where c.slug='zh-foundations-not-understand' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'我听不懂','wǒ tīng bù dǒng' from public.concepts c cross join public.languages l where c.slug='zh-foundations-not-understand' and l.code='zh' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.languages (code,name,speech_locale) values ('ar','Arabic','ar-SA') on conflict (code) do update set name=excluded.name,speech_locale=excluded.speech_locale;

insert into public.units (language_id,slug,title,description,sort_order) select id,'arabic-foundations','Arabic foundations','Fifteen Modern Standard Arabic phrases with transliteration. Gendered forms are labelled.',0 from public.languages where code='ar' on conflict (language_id,slug) where slug is not null do update set title=excluded.title,description=excluded.description;

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-hello',u.id,1,0,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Hello',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-hello' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'مرحبا','marḥaban' from public.concepts c cross join public.languages l where c.slug='ar-foundations-hello' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-good-morning',u.id,1,1,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Good morning',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-good-morning' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'صباح الخير','ṣabāḥ al-khayr' from public.concepts c cross join public.languages l where c.slug='ar-foundations-good-morning' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-good-evening',u.id,1,2,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Good evening',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-good-evening' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'مساء الخير','masāʾ al-khayr' from public.concepts c cross join public.languages l where c.slug='ar-foundations-good-evening' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-goodbye',u.id,1,3,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Goodbye',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-goodbye' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'مع السلامة','maʿa as-salāma' from public.concepts c cross join public.languages l where c.slug='ar-foundations-goodbye' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-thanks',u.id,1,4,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Thank you',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-thanks' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'شكرا','shukran' from public.concepts c cross join public.languages l where c.slug='ar-foundations-thanks' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-welcome',u.id,1,5,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'You are welcome',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-welcome' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'عفوا','ʿafwan' from public.concepts c cross join public.languages l where c.slug='ar-foundations-welcome' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-please',u.id,1,6,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Please (to a man)',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-please' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'من فضلك','min faḍlik' from public.concepts c cross join public.languages l where c.slug='ar-foundations-please' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-yes',u.id,1,7,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'Yes',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-yes' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'نعم','naʿam' from public.concepts c cross join public.languages l where c.slug='ar-foundations-yes' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-no',u.id,1,8,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'No',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-no' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'لا','lā' from public.concepts c cross join public.languages l where c.slug='ar-foundations-no' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-sorry',u.id,2,9,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I am sorry (male speaker)',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-sorry' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'أنا آسف','anā āsif' from public.concepts c cross join public.languages l where c.slug='ar-foundations-sorry' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-how-are-you',u.id,2,10,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'How are you? (to a man)',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-how-are-you' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'كيف حالك؟','kayfa ḥāluka' from public.concepts c cross join public.languages l where c.slug='ar-foundations-how-are-you' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-fine',u.id,2,11,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I am well',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-fine' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'أنا بخير','anā bi-khayr' from public.concepts c cross join public.languages l where c.slug='ar-foundations-fine' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-my-name',u.id,2,12,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'My name is…',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-my-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'اسمي…','ismī…' from public.concepts c cross join public.languages l where c.slug='ar-foundations-my-name' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-your-name',u.id,2,13,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'What is your name? (to a man)',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-your-name' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'ما اسمك؟','mā ismuka' from public.concepts c cross join public.languages l where c.slug='ar-foundations-your-name' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.concepts (slug,unit_id,difficulty,sort_order,speech_practice_enabled) select 'ar-foundations-not-understand',u.id,2,14,true from public.units u join public.languages l on l.id=u.language_id where l.code='ar' and u.slug='arabic-foundations' on conflict (slug) do nothing;

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'I do not understand',null from public.concepts c cross join public.languages l where c.slug='ar-foundations-not-understand' and l.code='en' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

insert into public.translations (concept_id,language_id,term,romanization) select c.id,l.id,'لا أفهم','lā afham' from public.concepts c cross join public.languages l where c.slug='ar-foundations-not-understand' and l.code='ar' and not exists (select 1 from public.translations t where t.concept_id=c.id and t.language_id=l.id);

commit;
