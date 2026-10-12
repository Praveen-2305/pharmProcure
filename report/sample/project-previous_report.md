

i

## MEDIVOX – HEALTH ASSISTANT
## PROJECT REPORT

Submitted by

## KRISHNAPRASATH SK (7376232CB127)
## KAMALESH V (7376232CT118)
## PRAVEEN V(7376232CT131)



In partial fulfilment for the award of the degree


## BACHELOR OF TECHNOLOGY
in
## COMPUTER SCIENCE AND BUSINESS SYSTEMS



## BANNARI AMMAN INSTITUTE OF TECHNOLOGY
(An Autonomous Institution Affiliated to Anna University, Chennai)
## SATHYAMANGALAM-638401

## ANNA UNIVERSITY: CHENNAI – 600 025

## APRIL 2026

ii

## BONAFIDE CERTIFICATE

Certified that this project report “MEDIVOX – HEALTH ASSISTANT” is
the    bonafide    work    of KRISHNAPRASATH SK(7376232CB127),
PRAVEEN   V(7376232CT131), KAMALESH  V(7376232CT118)  who
carried out the project work under my supervision.












## SIGNATURE        SIGNATURE

Dr. VENKATESAN R Mr. GUNALAN K
## HEAD OF THE DEPARTMENT

## Professor

## SUPERVISOR

Assistant Professor II

Department of Computer Science and
## Business Systems
Department of Computer Technology
Bannari Amman Institute of Technology Bannari Amman Institute of Technology



Submitted for Project Viva Voce examination held on..................






Internal Examiner I Internal Examiner II

iii

## DECLARATION


We affirm that the project work titled “MEDIVOX – HEALTH ASSISTANT”
being submitted in partial fulfillment for the award of the degree of Bachelor of
Technology in Computer Science and Business Systems is  the  record  of
original work done by us under the guidance of Mr. GUNALAN K, Assistant
Professor II, Department of Computer Technology. It has not formed a part
of any other project work(s) submitted for the award of any degree or diploma,
either in this or any other University.







## KRISHNAPRASATH SK PRAVEEN V KAMALESH V
## 7376232CB127 7376232CT131 7376232CT118





I certify that the declaration made above by the candidates is true.





Mr. GUNALAN K

iv

## ACKNOWLEDGEMENT

We express heartfelt thanks and deep gratitude to our esteemed Chairman
Dr. S.V. Balasubramaniam and the respected Principal Dr. C. Palanisamy for
providing excellent facilities and support during the course of study in this
institute.
We   are   grateful   to
Department  of Computer Science and Business Systems for  his  valuable
suggestions to carry out the project work successfully.

We  wish to express  our sincere  thanks  to Faculty guide Mr. GUNALAN  K,
Assistant   Professor   II,   Department   of   Computer   Technology for   her
constructive  ideas,  inspirations,  encouragement,  excellent  guidance,  and  much
needed technical support extended to complete our project work.

We  would like  to thank our friends,  faculty and non-teaching staff who  have
directly and indirectly contributed to the success of this project.








## PRAVEEN V (7376232CT131)
## KAMALESH V (73736232CT118)
## KRISHNAPRASATH S K (7376232CB127)

Dr.  R. Venkatesan,  Head  of  the  Department,

v

## ABSTRACT


In today’s digital healthcare landscape, delivering fast, accurate, and personalized
medical assistance through natural voice interaction has become increasingly important.
Traditional digital health platforms rely primarily on text-based systems and fragmented
services,  which  limit  accessibility,  responsiveness,  and  real-time  clinical  support.This
project   presents MediVox-Health   Assistant,   an   AI-powered   multimodal   clinical
intelligence system designed to provide real-time healthcare assistance through a voicefirst
interaction  model.The  platform  is  developed  using a  FastAPI-based  microservices
architecture  that enables  modular  design,  scalability,  and  efficient  service  orchestration.
User  speech  input  is  processed  using  Faster-Whisper  for  low-latency  speech-to-text
transcription with noise suppression, followed by intent classification and intelligent tool
routing powered by Large Language Models for accurate response generation.Multimodal
capability is incorporated through medical image analysis, enabling report interpretation
and  visual  health  understanding.  Natural  voice  responses  are  generated  using  a  text-to-
speech engine enhanced with Speech Synthesis Markup Language (SSML) to improve
clarity  and  conversational  experience.To  ensure  performance  and  reliability, Redis
caching   is   implemented   for   session   handling   and   rapid   response   retrieval,   while
PostgreSQL maintains  persistent  structured  health  records  and  interaction  history.The
system  supports  context-aware  conversational  memory.  Core  functionalities include
medicine classification, medical news retrieval using Retrieval-Augmented Generation
(RAG), health monitoring, automated report generation, and clinic discovery services.
Keywords: AI Healthcare, Voice Assistant, Multimodal Intelligence, Speech-to-Text,
Intent Classification, FastAPI Microservices, Large Language Models, Medical Image
Analysis, Text-to-Speech, Redis Caching, PostgreSQL, Retrieval-Augmented Generation.

vi

## TABLE OF CONTENT

## CHAPTER NO TITLE PAGE NO

## BONAFIDE CERTIFICATE II

## DECLARATION III

## ACKNOWLEDGEMENT IV

## ABSTRACT V

## TABLE OF CONTENTS VI

## LIST OF FIGURES VIII
## 1 INTRODUCTION 1
## 1.1 THE CASE FOR A VOICE AI HEALTHCARE ASSISTANT 2

1.1.1 Real-time healthcare assistance 2
## 1.2 OBJECTIVES OF THE SYSTEM 3

1.2.1 Advantages of the system 3
## 2 LITERATURE SURVEY 5
## 3 OBJECTIVES AND METHODOLOGY 7
## 3.1 OBJECTIVES 7
## 3.2 METHODOLOGY 8

3.2.1 Requirement analysis 8

3.2.2 System design 9

## 3.2.3 Implementation 11

3.2.4 Testing and validation 14

3.2.5 Deployment and demonstration 14
## 4 PROPOSED WORK MODULE 16
## 4.1 PROPOSED WORK MODULES 16

4.1.1 Admin module 16

vii


## CHAPTER NO TITLE PAGE NO

4.1.2 User module 17

4.1.3 Medicine classifier module 18

4.1.4 Medical news rag module 19

4.1.5 Health monitor module 19

4.1.6 Nearby clinic finder module 20
## 5 RESULTS AND DISCUSSION 21
## 5.1 COMPLETION STATUS 21
## 5.2 FUTURE PLANNING 22
## 5.3 SYSTEM INTERFACE SCREENSHOTS 24
## 6 CONCLUSIONS AND SUGGESTIONS 27
## 6.1 CONCLUSIONS 27
## 6.2 SUGGESTIONS FOR FUTURE WORK 28
## REFERENCES 31
## APPENDICES 33
## PLAGIARISM REPORT 36

viii

## LIST OF FIGURES

## FIGURE NO                               NAME OF THE FIGURE PAGE NO
## 3.1 SYSTEM ARCHITECTURE 10
## 3.2 ARCHITECTURE OF WHISPER STT MODEL 12
## 4.1 CACHE-AUGMENTED GENERATION PIPELINE 16
## 5.1 VOICE HEALTHCARE AI – HOME PAGE INTERFACE 24
## 5.2
## HEALTH MONITORING AND VITAL TRACKING
## DASHBOARD
## 24
## 5.3
## MEDICINE CLASSIFIER – DRUG INFORMATION OUTPUT
## INTERFACE
## 25

## 5.4
## CLINICAL ASSISTANT – NEARBY HEALTHCARE
## FACILITY RECOMMENDATION INTERFACE
## 25

## 1

## CHAPTER 1
## INTRODUCTION
In today's fast-evolving healthcare landscape, access to intelligent and responsive medical
assistance remains a critical challenge. Many individuals lack immediate access to medical
professionals  for  routine  queries,  medication  guidance,  and  health  monitoring.  Traditional
healthcare information systems often rely on static databases, fail to maintain conversational
context, and are unable to process multimodal inputs such as voice, text, and images.
The   Voice   AI   Healthcare   Assistant   offers   an   automated,   intelligent   solution   that
transforms   patient   interaction   and   clinical   information   delivery.   Utilizing   Artificial
Intelligence (AI), Large Language Models (LLMs), and Natural Language Processing (NLP),
it processes voice and text in real-time, classifying user intent to route queries to specialized
AI  sub-agents.  The  platform  features  modules  for  Medicine  Information,  Medical  News,
Health Monitoring, Medical Reports, and Nearby Clinic Finding.
Additionally,   a   Cache-Augmented   Generation   (CAG)   strategy   powered   by   Redis
minimizes  API  overhead  while  maintaining  accurate,  fast  responses.  With  seamless  cloud
integration  and local  Text-to-Speech synthesis, the Voice AI Healthcare  Assistant provides
scalable,  accessible,  and  context-aware  clinical  intelligence,  empowering  patients  and
caregivers to bridge the gap between health queries and expert guidance.


1.1 The Case for a Voice AI Healthcare Assistant
In  the  current digital  health  landscape,  obtaining  reliable  and  immediate  medical
information poses a considerable challenge for patients and caregivers. Traditional healthcare
information   systems   are   often   static,   text-only,   and   lack   the   ability   to   understand
conversational context or process multiple input modalities such as voice or medical images.
This frequently leads to poor health decisions, delayed responses to symptoms,

## 2

and a disconnect between individuals and timely medical guidance.

Furthermore, many individuals cannot easily navigate multiple applications or databases
to  gather  medicine  information,  find  nearby  clinics,  or  monitor  their  vital  signs  over  time.
There is a significant gap in the systematic provision of personalized, voice-accessible health
assistance with memory-enabled conversation tracking and AI-driven trend analysis.
With the rapid emergence of Multimodal Artificial Intelligence, cloud-based LLMs, and
real-time caching strategies, there is  now an  opportunity  to build  an intelligent, automated,
and  voice-first  healthcare  assistant.  This  innovative  system  accepts  voice,  text,  and  image
inputs, dynamically classifies user intent, and routes queries to specialized AI tools all while
maintaining conversational memory and delivering expressive voice responses.


1.1.1 Real-Time Healthcare Assistance via AI and Cloud Technology
The proposed solution harnesses the capabilities of Natural Language Processing (NLP),
Large Language Models (LLMs), and cloud caching technology to deliver instant healthcare
assistance. Advanced AI models intelligently transcribe user voice input, classify intent, and
invoke specialized tools such as Gemini Vision for medicine analysis, Groq LLM for news
summarization, and a Health Monitor powered by Redis and PostgreSQL.
By  caching  tool  responses  in  Redis  DB1  using  a  Cache-Augmented  Generation  (CAG)
strategy, the system delivers near-instantaneous responses on repeated queries, with a cache
hit  rate  averaging  over  70%.  The  Medicine  Classifier,  Medical  News  RAG,  Health
Monitoring,  Nearby  Clinic  Finder,  and  Medical  Report  modules  work  together  to  provide
continuous and actionable healthcare guidance.

## 3

1.2 Objectives of the System
The central  aim  of the Voice AI Healthcare Assistant is to provide a robust, intelligent,
and  efficient  solution  for  real-time  medical  information  retrieval,  health  monitoring,  and
personalized clinical guidance, ultimately enhancing health awareness and patient readiness.
Key objectives include:
Facilitating real-time voice and text-based healthcare assistance using AI, NLP, and
LLMs to  address medical queries accurately. Implementing a Medicine Classifier using
Gemini Vision  to  analyze  pharmaceutical  details  from  text  and  image inputs.  Providing  a
Medical  News  RAG module that fetches and summarizes relevant healthcare news using
NewsAPI and Groq  LLM. Building a Health Monitoring module that tracks vitals, detects
abnormal patterns, and  generates AI-driven trend analysis with Excel export.Introducing a
Nearby Clinic Finder that  uses OpenStreetMap's Overpass  API and Haversine distance to
locate healthcare facilities in  real-time.  Gathering conversational  context  via  Redis  DB0
session memory to enable multi- turn, context-aware interactions.


1.2.1 Advantages of the System
The  Voice  AI  Healthcare  Assistant  offers  a  wide  range  of  benefits  that  significantly
improve health information access and patient engagement:
Multimodal Input Processing, The system accepts voice, text, and image inputs, enabling
flexible and accessible interaction for diverse users and medical scenarios. Intelligent Intent
Routing  ,The  MCP  (Model  Control  Plane)  architecture  routes  user  requests  to  the  most
relevant  specialized  AI  tool  with  high  accuracy  and minimal  latency.  Cache-Augmented
Generation (CAG), Redis-based caching reduces repeated API costs by over 38%, with cache
hits responding in approximately 5ms versus over 2500ms for fresh queries.
Expressive Voice Responses, Kokoro TTS with SSML intent-based prosody delivers natural-
sounding,  context-appropriate voice output  entirely on-device without external API

## 4

dependency. Persistent Health Tracking, PostgreSQL-backed health logs enable longitudinal
vital  monitoring,  AI  trend  analysis,  and  automated  Excel  report  generation  for  clinical
reference. Scalable and Accessible Design: Cloud-integrated backend with Docker-managed
services ensures simultaneous multi-user access with real-time processing capabilities.

## 5

## CHAPTER 2
## LITERATURE SURVEY

[1] Alec Radford et al. (2022) introduced Whisper, a robust automatic speech recognition
(ASR) system trained on large-scale multilingual data. Whisper demonstrated high accuracy
in  transcribing  speech  across  diverse  accents  and  noisy environments.  Its  ability  to  handle
real-world  audio  makes  it  highly  suitable  for  voice-based  healthcare  assistants,  where
accurate transcription of patient queries is critical.
[2] IBM  developed  IBM  Watson  Health  (2015),  which  pioneered  the  application  of
artificial  intelligence  in  healthcare.  The  system  integrates  natural  language  processing,
clinical  data  analysis,  and  decision  support  to  assist  healthcare  professionals.  This  work
highlights  the  importance  of  AI-driven  healthcare  systems  capable  of  processing  large
volumes of medical data and providing intelligent recommendations.
[3] Tom B. Brown et al. (2020) introduced large-scale language models such as GPT-3,
demonstrating   the   ability   of   transformer-based   architectures   to   perform   reasoning,
summarization, and conversational tasks. These advancements laid the foundation for modern
conversational  AI  systems  that  can  understand  user  intent  and  generate  context-aware
responses in real time.
[4] Google  introduced  Gemini  (2017),  a  multimodal  artificial  intelligence system
capable  of  processing  text,  images,  and  other  data  types  simultaneously.  This  capability  is
particularly  relevant  in  healthcare  applications  such  as  medicine  identification,  where  both
textual descriptions and visual inputs (e.g., pill images) must be analyzed together.
[5] Hugo Touvron et al. (2023) presented LLaMA, a family of efficient large language
models designed for high-performance reasoning with reduced computational requirements.
These models are widely used in real-time applications such as intent classification and tool
routing in conversational agents, forming the backbone of modern AI assistant architectures.

## 6

[6] Research  in  healthcare  machine  learning  (2017) has  demonstrated  that  traditional
models  such  as  Random  Forest  and  Support  Vector  Machine  are  highly  effective  for
structured  data  prediction  tasks,  including  disease  diagnosis  and  risk  assessment.  These
models are typically evaluated using metrics such as accuracy, precision, and recall, and have
been successfully applied in predicting conditions such as heart disease, diabetes, and kidney
disorders. However, their limitation lies in handling unstructured and multimodal data.
[7] Recent  advancements  in conversational  AI  systems  (2015) have  introduced  the
concept of tool-based architectures, where user queries are dynamically routed to specialized
modules  based  on  intent  classification.  These  systems  leverage  large  language  models  to
perform reasoning, context management, and response aggregation. This paradigm is directly
reflected in  modern  voice  AI  healthcare  assistants,  where  multiple  tools  such  as  medical
report  generation,  news  retrieval,  health  monitoring,  and  clinic  location  services  are
orchestrated through a centralized control mechanism.
[8] Studies  in  real-time  data  systems  and  distributed  architectures  (2012) highlight
the importance of caching and memory management in AI applications. Technologies such
as Redis and PostgreSQL are widely used for managing session context, caching responses,
and   storing   long-term   structured   data.   These   systems   enable   scalable   and   efficient
performance  in  applications  requiring  continuous  interaction  and  historical  data  tracking,
such as healthcare monitoring systems.
[9] Text-to-speech  (TTS)  systems  (2019) have  also  evolved  significantly,  enabling
natural and expressive  voice generation. Modern TTS systems incorporate prosody control
mechanisms such as Speech Synthesis Markup Language (SSML) to adjust tone, pitch, and
pacing  based  on  context.  This  is  particularly  important  in  healthcare  assistants, where
empathetic and clear communication enhances user experience and accessibility.

## 7

## CHAPTER 3
## OBJECTIVES AND METHODOLOGY
## 3.1 OBJECTIVES
With  the  rapid  adoption  of  AI,  multimodal  large  language  models,  and  voice  interface
technologies  in  healthcare,  there  is  a  growing  need  for  a  real-time,  intelligent,  and  user-
friendly  clinical  assistant  that  can  bridge  the  gap  between  patients  and  dynamic  medical
information.  Traditional  healthcare  information  systems  depend  heavily  on  manual  search,
static text databases, and lack conversational memory or voice interaction capabilities. These
outdated  approaches  often  lead  to  delayed  responses,  poor  health  decision-making,  and  an
inaccessible experience for non-technical users.
This  project  aims  to  overcome  these  limitations  by  developing  a  Voice  AI  Healthcare
Assistant  that  integrates  Natural  Language  Processing  (NLP),  Large  Language  Models
(LLMs), Multimodal Vision AI, and cloud services to deliver real-time voice-first healthcare
assistance,  personalized  health  monitoring,  AI-based  medicine  analysis,  and  context-aware
clinical guidance.
The specific objectives of this project are:

To  develop  a  voice  and  text-based  platform  for  real-time  healthcare  assistance  using
NLP,  LLMs,  and  multimodal  AI.  Implement  a  Medicine  Classifier  module  using  Gemini
Vision  that  analyzes  pharmaceutical  text  and  images  to  extract  drug information,  usage,
categories,  and  safety  protocols.  To  integrate  a  Medical  News  RAG  module  that  retrieves
and  summarizes  relevant  healthcare  news  using  NewsAPI  and  Groq  LLM  with  TF-IDF
ranking and cosine similarity.

## 8

To   build   a   Health   Monitor   module   that   logs   vitals,   detects   abnormal   ranges
(hypertension, prediabetic), performs AI trend analysis, and exports structured Excel reports.
To incorporate a Nearby Clinic Finder using OpenStreetMap's Overpass API and Haversine
distance  calculations  to  locate  healthcare  facilities  in  real-time.  To  design  a  Cache-
Augmented  Generation  (CAG)  strategy using  Redis  DB1  to  minimize  redundant  API  calls
and deliver sub-5ms responses on cached queries.
To develop an expressive Text-to-Speech (TTS) output system using Kokoro TTS with
SSML intent-based  prosody  for  natural,  context-aware  voice  delivery.  To ensure  data
security and privacy using cloud authentication, encrypted storage, and secure data handling
via  Docker- managed  PostgreSQL  and  Redis  services.  To  test  and  validate  the  system  for
accuracy, efficiency, scalability, and user satisfaction under real-world conditions.


## 3.2 METHODOLOGY
The  methodology  adopted  for  this  project  follows  a  structured  software  development
approach, ensuring systematic progress from requirement analysis to deployment and testing.
Each  phase  focuses  on  building  and  validating  the  AI-powered  voice  healthcare  assistant
effectively.
## 3.2.1 Requirement Analysis
The  initial  stage  involved  identifying  existing  gaps  in  healthcare  information  and  voice
assistant  systems,Manual  health  information  search  is  time-consuming  and  often  yields
inaccurate  or  non- personalized  results.  Existing  voice  assistants  lack  medical  domain
specialization  and  multimodal  input  processing.  There  is  no  real-time  conversational
memory   in   most   health   chatbots,   leading   to   repetitive,   context-unaware   interactions.
Existing  solutions  are  either  expensive,  limited  in  features,  or  dependent  on  continuous
internet access for every query.


## 9

From this analysis, the following requirements were identified:

The system must provide real-time voice and text-based healthcare assistance using AI,
NLP,  and  LLMs.  It  should  integrate  specialized  AI  tools  for  medicine,  news,  health
tracking,    reports, and clinic finding. The solution must maintain session-based
conversational memory  using  Redis. It  should  include  Cache-Augmented  Generation  for
continuous   performance   improvement.   The   platform   must   be   secure,   scalable,   and
accessible across devices.

## 3.2.2 System Design
The system architecture is based on a Model Control Plane (MCP) using AI and cloud
infrastructure Client Interface (User Module) - Allows users to submit voice, text, or image
inputs, view AI-generated responses, listen to TTS output, and track health trends via visual
dashboards.Speech-to-Text Engine - Processes browser audio using Faster-Whisper (distil-
small.en) with VAD silence trimming for accurate, low-latency transcription.


Intent  Classification  Layer - Uses  Groq  llama-3.1-8b-instant  to  classify  transcribed
queries    into    one    of    five    intents:    medicine_info,    medical_news,    health_monitor,
medical_report,  or clinic_finder.Tool Execution Layer , Routes intents to specialized sub-
agents: Gemini Vision for medicine, NewsAPI+Groq for news RAG, Redis+PostgreSQL for
health  monitoring,  GPT-4o  for  reports,  and  Overpass  API  for  clinics.  Cache-Augmented
Generation  (CAG) - Redis  DB1  stores  MD5-hashed  tool  responses  with  36-hour  TTL,
achieving 70%+ cache hit rates and 38% faster overall throughput.

Response Aggregation - Groq llama-3.3-70b-versatile synthesizes tool outputs with session
context from Redis DB0 into coherent, conversational replies. Kokoro TTS SSML -

## 10

Generates expressive, intent-adjusted voice responses locally using the af_heart voice model
at 24kHz audio quality.






## Fig 3.1 System Architecture

## 11

## 3.2.3 Implementation
The  Intent  Classifier  aims  to  accurately  map  user  voice  and  text  queries  to  one  of  five
predefined  healthcare  tool  intents  using  a  fast  LLM,  enabling  low-latency  routing  with
structured  JSON  output.  The  implementation  used  FastAPI  for  the  backend  REST  API,
Faster-Whisper  (CTranslate2)  for  STT,  Groq  SDK  for  LLM  inference,  Gemini  SDK  for
vision-based  medicine  classification,  Librosa  and  PyAV  for  audio  preprocessing,  Kokoro
TTS  for  local  voice  synthesis,  Redis-py  for  caching  and  context,  asyncpg  for  PostgreSQL
interaction, and Pydantic for data validation.
The  system  processes  multi-session  user  queries  across  five  healthcare  domains.  Tool
response  caching  in  Redis  DB1  builds  a  growing  knowledge  base  of  previously  answered
queries, while PostgreSQL stores longitudinal vital sign records including systolic/diastolic
BP, fasting sugar, symptoms, and user notes across sessions.
Browser audio captured via WebM/Opus is decoded using PyAV. Librosa resamples the
data to 16kHz and strips trailing silence using energy-based VAD bounds, reducing inference
time  by  50-100ms  per  query.  The  processed  float32  NumPy  arrays  are  passed  directly  to
Faster-Whisper for transcription.
Before invoking any tool, the system computes an MD5 hash of the query scope, intent,
entities, and query string. Redis DB1 is checked for a matching key. On a cache hit, the stored
response  is  returned  in  approximately  5ms.  On  a  miss,  the  tool  is  invoked,  the  response  is
stored in Redis DB1 with a 36-hour TTL, and the result is returned to the user.

## 12









Fig 3.2 Architecture of Whisper STT model

## 13

Five  specialized  tools  were  developed:  (1)  Medicine  Classifier -Gemini  Vision  OCR-
based     pharmaceutical entity extraction, (2) Medical News RAG - TF-IDF + cosine
similarity ranking of NewsAPI articles summarized via Groq,(3) Health Monitor -Pydantic-
validated  vital  logging with  PostgreSQL persistence  and  AI trend  analysis;  (4)  Nearby
Clinic  Finder - Overpass  API  +  Haversine  distance computation  for  sorted  local  clinic
results; (5) Medical Report -GPT-4o structured health data summarization.
System  performance  was  assessed  using  intent  classification  accuracy,  tool  response
latency, cache hit rate, STT word error rate, and TTS naturalness. The CAG strategy achieved
70%+  cache  hit  rates.  Intent  classification  with  llama-3.1-8b-instant  averaged  300ms.  STT
processing averaged 600ms on CUDA-enabled GPUs.
The Groq llama-3.3-70b-versatile model synthesizes tool outputs and Redis DB0 session
context into human-sounding responses. These are passed to the Kokoro TTS SSML builder,
which applies intent-specific prosody control (rate, pitch, break points) before generating a
24kHz WAV file served to the React frontend.
The  system  is  deployed  using  Docker  Compose  for  PostgreSQL  (port  5433)  and  Redis
(port  6379)  services,  Uvicorn  ASGI  for  the  FastAPI  backend,  and  Vite  for  the  React
TypeScript frontend. All services are containerized for reproducible, scalable deployment.
Analysis   showed   that   voice-first   interaction   dramatically   lowers   barriers   for   non-
technical users in healthcare settings. The CAG caching strategy provides the most significant
performance  gain,  reducing  LLM  API  costs  by  eliminating  redundant calls  for  frequently
asked medical queries. Multimodal input (voice + image) enables use cases such as scanning
medicine packaging, which purely text-based systems cannot support.

## 14

3.2.4 Testing and Validation
Comprehensive  testing  was  conducted  to  evaluate  functionality,  performance,  and
usability:
Functional Testing -- Verified accurate intent classification, tool invocation, medicine
extraction, news summarization, health tracking, clinic finding, and TTS delivery.

Performance Testing - Measured STT processing time, intent classification latency, tool
execution speed, cache lookup time, and end-to-end voice response latency.

Accuracy Testing - Evaluated intent classification precision, medicine entity extraction
accuracy, news relevance ranking, and vital anomaly detection correctness.

Compatibility Testing - Ensured proper functioning across Chrome, Firefox, and mobile
browsers for voice recording and response playback.

User Testing - Collected feedback from users to refine voice interaction UX, response
naturalness, and health monitoring dashboard readability.
3.2.5 Deployment and Demonstration
The final system was deployed in a cloud-integrated environment with local TTS for real-
time access:
Users  interacted  via  voice,  receiving  instant  AI-classified  responses  from  specialized
healthcare  tools.  The  Medicine  Classifier  demonstrated  accurate  pharmaceutical  entity
extraction from both text descriptions and uploaded medicine packaging images. The Health
Monitor  showcased  real-time  vital  logging,  AI-generated  trend  analysis  with  dietary  and
mental health guidance, and Excel export functionality.

## 15

The  demonstration  highlighted  how  the  system  simplifies  access  to  medical  information,
improves  health  monitoring  accuracy,  and  provides  actionable  clinical  guidance  through  a
natural voice interface.

## 16

## CHAPTER 4
## PROPOSED WORK MODULE
## 4.1 Proposed Work Modules
The proposed Voice AI Healthcare Assistant system is designed to deliver an intelligent,
automated,  and  comprehensive  solution  for  real-time  medical  information  retrieval,  health
monitoring,  personalized  medicine  analysis,  and  structured  clinical  guidance.  The  system
architecture  is  divided  into  six  core  modules - Admin,  User  (Patient/Caregiver),  Medicine
Classifier, Medical News RAG, Health Monitor, and Nearby Clinic Finder - each performing
distinct yet interconnected functions to ensure a seamless user experience and efficient system
performance.

Fig 4.1 Cache-Augmented Generation Pipeline
## 4.1.1 Admin Module
## Key Features:
User  Management:  Enables  the  admin  to  manage  user  sessions,  monitor  platform
activity,  and  oversee  data  retention  policies  for  patient  health  records.  Tool  Configuration:
Allows  the  admin  to  update  API  keys,  configure  Redis  TTL  settings,  adjust  intent
classification thresholds, and manage PostgreSQL schema migrations.System Performance

## 17

Monitoring, Tracks cache hit rates, LLM API usage, tool response latencies, and STT
accuracy metrics to optimize system performance.Security and Data Integrity: Ensures secure
data handling, Docker service health monitoring, and database backup management.
## Key Benefit:

Maintains system reliability, ensures tool accuracy, and facilitates continuous platform
improvement through centralized oversight and configuration management.
## 4.1.2 User Module
The User Module is specifically developed for patients, caregivers, and health-conscious
individuals who wish to access medical information, monitor their health, and interact with
AI-powered clinical tools through a natural voice interface.
## Key Features:

Voice and Multimodal Input: Allows users to submit voice recordings, text queries, or
medical images, which are automatically processed through the STT engine, intent classifier,
and  appropriate  AI tool.  Real-Time  Response  Delivery:  Instantly  receives  tool-generated
answers aggregated by Groq llama-3.3-70b-versatile and delivered as expressive Kokoro TTS
voice  output  with  SSML-controlled  prosody.  Session  Memory  and  Context:  Redis  DB0
maintains a rolling conversation history of up to 10 interactions per session, enabling context-
aware multi-turn dialogue.

Health  Dashboard:  Enables  users  to  log  and  visualize  vital  signs,  view  AI-generated
health  trend  analysis,  and  download  structured  Excel  reports.  Clinic  Locator:  Displays
nearby  hospitals  and  clinics  on  the  React  frontend  with  distances  computed  using  the
Haversine formula from OpenStreetMap data.

## 18



## Key Benefit:

Empowers users to access professional-grade medical information and health monitoring
through a natural voice interface, improving health awareness and decision-making.
## 4.1.3 Medicine Classifier Module
The Medicine Classifier Module serves as the system's pharmaceutical intelligence core,
linking  user  medicine queries  and  images  to  structured  drug  information  through  Gemini
Vision AI.
## Key Features:

Multimodal Medicine Analysis: Processes both text descriptions and base64-encoded
medicine  packaging  images  using  Gemini  gemini-2.0-flash  for  OCR  and pharmaceutical
entity  extraction.Structured  Information  Extraction:  Identifies  drug  generic  names,  brand
names,  usage  purposes,  drug  categories,  dosage  guidelines,  and  safety  protocols  from
unstructured  inputs.  CAG  Cache  Integration:  Stores  medicine  query results  in  Redis  DB1
using MD5-hashed keys, enabling instantaneous retrieval for previously queried medications.
Safety  Protocol  Flagging:  Highlights  contraindications,  interaction  warnings,  and  dosage
cautions to support informed patient decision-making.

## Key Benefit:

Streamlines   pharmaceutical   information   access   by   automatically   extracting   and
structuring drug details from text or images, significantly reducing manual lookup effort while
improving patient medication safety.

## 19

4.1.4 Medical News RAG Module
The Medical News RAG Module provides users with current, relevant healthcare news
by combining retrieval-augmented generation with LLM summarization.
## Key Features:

NewsAPI  Integration:  Fetches  recent  healthcare  articles  based  on extracted  query
entities, ensuring topical and up-to-date news retrieval. TF-IDF + Cosine Similarity Ranking:
Ranks retrieved articles by relevance to the user query using a hybrid TF-IDF vector scoring
and  cosine  similarity  schema,  selecting  only  the  top 5  most  relevant  results.  Groq  LLM
Summarization: Summarizes selected articles using Groq LLM to produce concise, factually
grounded healthcare news responses while minimizing hallucination. CAG Caching: Stores
news query responses in Redis DB1 to avoid redundant NewsAPI and LLM calls for repeated
topic queries within the 36-hour TTL window.

## Key Benefit:

Keeps users informed with current, AI-summarized medical news while minimizing API costs
through intelligent caching and relevance-ranked retrieval.
## 4.1.5 Health Monitor Module
The Health Monitor Module enables longitudinal vital sign tracking, AI-driven trend
analysis, and automated health report generation with clinical guidance.
## Key Features:

Pydantic, Validated   Vital   Logging:   Accepts   and   validates   systolic/diastolic   blood
pressure,  fasting  blood  sugar,  symptoms,  and  custom  notes  with  Pydantic  models  before
persisting  to  PostgreSQL.Anomaly  Detection:  Automatically  detects  out-of-range  vital
values  (hypertension  danger  zones,  prediabetic  blood  sugar  levels)  and  triggers  AI  trend
analysis with dietary constraints and mental health guidance. AI Trend Analysis: GPT-4o

## 20

analyzes   longitudinal   health   records   from   PostgreSQL   to   generate   structured   trend
summaries,  risk  assessments,  and personalized  health  recommendations.  Excel  Report
Export:  Automatically  generates  downloadable  .xlsx  reports  compiling  the  user's  health
history for clinical reference and medical appointments.
## Key Benefit:

Enables   proactive   health   management   by   providing   continuous   vital   monitoring,
intelligent  anomaly  detection,  and  clinically  informed  AI  guidance  in  a  single  integrated
module.
## 4.1.6 Nearby Clinic Finder Module
The  Nearby  Clinic  Finder  Module  assists  users  in  locating  healthcare  facilities  in  their
vicinity using real-time geospatial data from OpenStreetMap.
## Key Features:

Overpass API Integration: Fetches hospitals, clinics, and healthcare nodes within a 10km
radius from OpenStreetMap's comprehensive   geospatial database.   Haversine Distance
Computation:  Calculates  precise  distances  from  the  user's  location  to  each  retrieved
healthcare facility, enabling accurate distance-sorted results.

## Key Benefit:

Guides users to the nearest  appropriate  healthcare  facilities using real-time  geospatial
data, reducing the time and uncertainty involved in finding local medical care.

## 21

## CHAPTER 5
## RESULTS AND DISCUSSION

## 5.1 Completion Status
The development of the Voice AI Healthcare Assistant has been successfully carried out,
with the majority of the planned modules and functionalities fully implemented and tested.
the  user  interface  for  the  web  application  has  been  meticulously  designed  to  provide  an
intuitive,  voice-first,  and  seamless  experience,  allowing  patients  and  caregivers  to  interact
with specialized AI healthcare tools through voice, text, and image inputs without requiring
technical expertise.
The  React  and  Vite-based  frontend  has  been  successfully  hosted  and  configured  to
ensure   stable   performance,   secure   communication   with   the   FastAPI   backend,   and
uninterrupted  accessibility  for  users.  This  stable  architecture  allows  the  platform  to  handle
multiple concurrent user sessions while maintaining responsiveness through Docker-managed
Redis and PostgreSQL services.
The Speech-to-Text (STT) pipeline using Faster-Whisper (distil-small.en) has been fully
developed  and  integrated.  With  VAD-based  silence  trimming  via  Librosa,  the  system
processes  browser-recorded  WebM/Opus  audio  and  produces  accurate  transcriptions  in
approximately 600  milliseconds on CUDA-enabled hardware, effectively handling  medical
terminology and varied voice inputs.
The  Intent  Classification  module  powered  by Groq's  llama-3.1-8b-instant  has  been
implemented to accurately route user queries to one of five specialized healthcare tools with
an average inference latency of 300 milliseconds and reliable structured JSON output. The
Cache-Augmented  Generation  (CAG)  strategy  using  Redis  DB1  has  been  successfully
deployed, achieving a cache hit rate exceeding 70% for repeated medical queries and reducing

## 22

tool response times from over 2500 milliseconds to approximately 5 milliseconds on cache
hits a throughput improvement of 38%.
The Medicine Classifier Module using Gemini gemini-2.0-flash has been fully developed
and tested. It successfully performs OCR and pharmaceutical entity extraction from both text
descriptions  and  base64-encoded  medicine packaging  images,  accurately  identifying  drug
names, categories, dosages, and safety protocols. The Medical News RAG module combining
NewsAPI  with  TF-IDF  ranking  and  Groq  LLM  summarization  has  been  implemented,
consistently  returning  the  top  5  most  relevant  healthcare  articles  with  factually  grounded
summaries.
The   Health   Monitor   Module   powered   by   Redis   DB0   and   PostgreSQL has   been
successfully  integrated,  enabling  Pydantic-validated  vital  sign  logging,  real-time  anomaly
detection   for   hypertension   and   prediabetic   conditions,   AI-driven   trend   analysis,   and
automated  Excel  report  generation.  The  Nearby  Clinic  Finder  using  Overpass  API  and
Haversine  distance  calculations  accurately  returns  sorted  clinic  listings  within  a  10  km
radius.
Finally,  the  Kokoro  TTS module  with  SSML-based  intent-specific  prosody  control  has
been  deployed locally, delivering natural-sounding voice responses at 24kHz audio quality
without any external API dependency, ensuring complete data privacy and consistent voice
output quality across all interaction types.
## 5.2 Future Planning
While the current system offers a robust set of features, several enhancements are planned
to  improve  usability,  clinical  accuracy,  and  overall  user  experience  in  future  updates.  One
planned  enhancement  is  the  integration  of  a  Wearable  Device  Data  Connector,  which  will
allow  the  system  to  ingest  real-time  vital  readings  from  IoT  health  devices  such  as
smartwatches  and  continuous  glucose  monitors,  enabling  proactive  health  alerts  without
requiring manual vital entry.

## 23

Another  planned  addition  is  a  Multi-Language  Voice  Support  feature.  The  current
system  is optimized  for  English  using  the  distil-small.en  Faster-Whisper  model.  Future
versions will incorporate multilingual STT models to support regional languages, improving
accessibility  for  non-English  speaking  users  in  underserved  communities.  A  Telemedicine
Appointment  Scheduler  is  also  planned,  which  will  integrate  with  clinic  APIs  discovered
through the Nearby Clinic Finder module to allow users to book appointments directly within
the voice interface, reducing friction between health information and care access.
Additionally, a Federated Learning module for Health Trend Personalization is planned,
which  will  allow  the  Health  Monitor's  AI  trend  analysis  to  be  refined  using  anonymized
local health patterns without centralizing sensitive patient data, addressing privacy concerns
in  clinical  AI  deployment.  Continuous  UI  enhancements  are  planned  to  improve  voice
waveform visualization, health dashboard interactivity, and mobile responsiveness.
These updates aim to make the platform more engaging, accessible, and intuitive for all
users, particularly elderly patients who may benefit from simplified voice-first navigation.
Together,  these  planned  improvements  will  further  strengthen  the  Voice  AI  Healthcare
Assistant,  making  it  a  more  comprehensive,  clinically  informed,  and  privacy-preserving
solution for real-time health guidance, monitoring, and care access.

## 24

## 5.3 System Interface Screenshots

Fig 5.1 Voice Healthcare AI – Home Page Interface



Fig 5.2 Health Monitoring and Vital Tracking Dashboard

## 25



## Fig 5.3 Medicine Classifier – Drug Information Output Interface



Fig 5.4 Clinical Assistant – Nearby Healthcare Facility Recommendation Interface

## 26



## Fig 5.5 System Performance Metrics Dashboard



Fig 5.6 Redis Cache Management and Conversation Storage Interface

## 27

## CHAPTER 6
## CONCLUSIONS AND SUGGESTIONS FOR FUTURE WORK
## 6.1 Conclusions
The proposed Voice AI Healthcare Assistant provides a robust, intelligent, and voice-
first solution for real-time medical information retrieval, health monitoring, pharmaceutical
analysis, and clinical guidance. By integrating Large Language Models (LLMs), Multimodal
Vision  AI,  Automatic  Speech  Recognition  (ASR),  and  cloud-based  services,  the  system
enables   accurate   voice   transcription,   real-time   intent   classification,   and   personalized
healthcare  tool  execution  without  requiring  manual  search  or  navigation.  Its  modular
architecture - including the STT Engine, Intent Classifier, Medicine Classifier, Medical News
RAG, Health Monitor, Nearby Clinic Finder, and Kokoro TTS - ensures seamless interaction,
transparent workflows, and improved health information access for patients and caregivers.

Real-Time Voice Healthcare Assistance: Efficiently transcribes and processes user voice
and text inputs, classifying intent  and  routing to  specialized AI tools with an average end-
to-end  latency  suitable  for  real-time  interaction.  Medicine  Information  Analysis,Leverages
Gemini  Vision  multimodal  OCR  to  accurately  extract  pharmaceutical  details  from  text
descriptions   and   medicine   packaging   images,   providing   structured   drug   information.
Medical News Retrieval and Summarization: Combines NewsAPI retrieval with  TF-IDF
ranking and Groq LLM summarization to deliver   factually   grounded, topic-relevant
healthcare  news  summaries.  Health  Monitoring  and  Trend  Analysis,  Enables  longitudinal
vital  sign  tracking  with  AI-driven  anomaly  detection,  personalized  health  guidance,  and
automated Excel report generation via PostgreSQL-backed storage.

## 28


Cache-Augmented Generation (CAG): Achieves a 70%+ cache hit rate using Redis DB1
with MD5-hashed keys, reducing repeated API costs and delivering approximately 5ms
response times on cached queries versus 2500ms for fresh tool calls.Expressive Local Text-
to-Speech:  Delivers  intent-adjusted,  natural-sounding  voice  responses  using  Kokoro  TTS
with SSML prosody control entirely on-device, ensuring data privacy and zero external TTS
API dependency. Scalable and Accessible Design: Docker-managed PostgreSQL and Redis
services ensure reproducible, scalable deployment supporting concurrent multi-user sessions
with real-time processing capabilities.

Overall, the Voice AI Healthcare Assistant demonstrates how modern LLMs, multimodal
AI,   and   real-time   caching   strategies   can   transform   healthcare   information   access.   It
enhances  health  literacy,  improves  response  accuracy,  and  provides  actionable  clinical
guidance to users in a practical, reliable, and scalable manner.
6.2 Suggestions for Future Work
While    the    current    implementation    meets    the    core    project    objectives,    several
enhancements  can  be  implemented  to  further  improve  clinical  accuracy,  accessibility,  and
overall impact:
Wearable  Device  Integration:  Connect  the  Health  Monitor module  to  IoT  wearables
(smartwatches,  glucometers)  for  continuous,  passive  vital  sign  logging  and  proactive  AI
health alerts. Multilingual STT and TTS Support: Incorporate multilingual Faster-Whisper
models  and  multilingual  TTS  voices  to  serve  non-English speaking  users,  improving
accessibility across regional populations. Telemedicine Appointment Scheduling: Integrate
clinic  booking  APIs  into  the  Nearby  Clinic  Finder  workflow,  allowing  users  to  schedule
appointments  directly  through  the  voice  interface.  Federated  Learning  for  Health

## 29


Personalization: Implement federated learning to refine the Health Monitor's AI trend
analysis using anonymized local health patterns without centralizing sensitive patient data.
Electronic Health Record (EHR) Integration: Connect the Health Monitor to standard EHR
systems (FHIR APIs) for bidirectional health data exchange with clinical providers.
Advanced Pharmaceutical Safety Checks: Enhance the Medicine Classifier with drug
interaction detection, checking combinations against clinical pharmaceutical databases in
real time.

Expanded Intent Coverage: Add new specialized tools for mental health support, diet
guidance,  vaccination  tracking,  and  chronic  disease  management  beyond  the  current  five
intents.  AI-Powered  Symptom  Triage:  Implement  a  guided  symptom  assessment  tool  that
uses structured conversational prompting to suggest preliminary diagnoses and appropriate
care  pathways.  Push  Notifications  for  Health  Alerts:  Integrate  real-time  push  notifications
for vital sign anomalies, medication reminders, and appointment confirmations via mobile
and desktop channels.

User Feedback and Analytics Dashboard: Implement analytics to track cache hit rates,
tool  usage  patterns,  health  monitoring trends,  and  user  satisfaction  to  guide  continuous
system improvement. Advanced Data Security: Introduce end-to-end encryption, two-factor
authentication,  and  role-based  access  controls  to  enhance  protection  of  sensitive  patient
health  information.  Offline Voice  Mode:  Develop  an  offline-capable  lightweight  STT  and
intent classification pipeline for deployment in low-connectivity environments such as rural
clinics. Gamified Health Tracking: Add features that motivate users to log vitals consistently,
track health milestones, and achieve wellness goals through interactive progress indicators.

## 30


Clinical    Validation    Studies,Conduct    structured    user    studies    with    healthcare
professionals  to  validate  the  accuracy  of  medicine  information,  health  trend  analysis,  and
news summarization outputs against clinical ground truth. These enhancements aim to make
the Voice AI Healthcare Assistant not only a powerful real-time health information tool but
also  a  comprehensive  clinical  companion  capable  of  guiding  users  from  health  queries  to
informed care decisions and proactive wellness management.

## 31

## REFERENCES


[1] A.  Radford,  J.  W.  Kim,  T.  Xu,  G.  Brockman,  C.  McLeavey,  and  I.  Sutskever,  "Robust  Speech
Recognition via Large-Scale Weak Supervision," in Proc. 40th Int. Conf. on Machine Learning (ICML),
2023, pp. 28492–28518. [Online]. Available: https://arxiv.org/abs/2212.04356

[2] A. Team Google, "Advancing Medical AI with Med-Gemini," Google Research Blog, May 2024.
[Online]. Available: https://research.google/blog/advancing-medical-ai-with-med-gemini/
[3] D. Macháček, R. Dabre, and O. Bojar, "Turning Whisper into Real-Time  Transcription  System,"  in
Proc. 13th Int. Joint Conf. on Natural Language Processing and the 3rd Conf. of the Asia-Pacific Chapter
of  the  Association  for  Computational  Linguistics  (IJCNLP-AACL),  Nov.  2023,  pp.  17–22.  [Online].
Available: https://aclanthology.org/2023.ijcnlp-demo.3
[4] Gemini  Team  Google,  "Gemini:  A  Family  of  Highly  Capable  Multimodal  Models," arXiv  preprint
arXiv:2312.11805, Dec. 2023. [Online]. Available: https://arxiv.org/abs/2312.11805
[5] H. Zhou, J. Gu, X. Zou, Y. Li, S. Chen, Y. Zhou, L. Tan, H. Xu, X. Li, F. Liu, and S. Huang, "A Survey
of   Large   Language   Models   in   Medicine:   Progress,   Application,   and   Challenge," arXiv   preprint
arXiv:2311.05112, Nov. 2023. [Online]. Available: https://arxiv.org/abs/2311.05112
[6] J. Wang, Y. Shi, Y. Wang, Q. Li, D. Dai, G. Zhou, and W. Lam, "A Survey on Large Language Models
from General Purpose to Medical Applications: Datasets, Methodologies, and Evaluations," arXiv preprint
arXiv:2406.10303, Jun. 2024. [Online]. Available: https://arxiv.org/abs/2406.10303
[7] K. He, Y. Mao, Q. Lin, Y. Wang, P. Lan, X. Pan, and P. Lio, "A Survey of Large Language Models
for  Healthcare:  from  Data,  Technology,  and  Applications  to  Accountability  and  Ethics," arXiv  preprint
arXiv:2310.05694, Oct. 2023. [Online]. Available: https://arxiv.org/abs/2310.05694
[8] L.  Shi,  H.  Qiao,  C.  Yang,  Y.  Jiang,  K.  Yu,  and  C.  Chen,  "Research  and  Application  of  Distributed
Cache  Based  on  Redis," Journal  of  Software,  vol.  19,  no.  1,  pp.  1–8,  Jan.  2024.  [Online].  Available:
https://www.jsoftware.us/show-247-3119-1.html
[9] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W. Yih, T.
Rocktäschel,  S.  Riedel,  and  D.  Kiela,  "Retrieval-Augmented  Generation  for  Knowledge-Intensive  NLP
Tasks," in Advances in Neural Information Processing Systems (NeurIPS), vol. 33, 2020, pp. 9459–9474.
[Online]. Available: https://arxiv.org/abs/2005.11401
[10] Y. Heo and S. Lee, "Supervised Contrastive Learning for Voice Activity Detection," Electronics, vol.
12, no. 3, p. 705, Jan. 2023. doi: 10.3390/electronics1203070

## 32

## APPENDICES

## PRAVEEN V (7376232CT131)

## Week Description
## Week 1
Designed system architecture and workflow. Developed FastAPI backend.
Implemented STT using Faster-Whisper. Built intent classification using
LLM. Integrated Groq and Gemini APIs. Designed tool pipeline. Used
Redis caching. Optimized performance and latency.
## Week 2
Analyzed system requirements. Designed database schema. Implemented
authentication and RBAC. Created core API endpoints. Integrated
MongoDB. Tested APIs using Postman. Improved validation and security.
## Week 3
Developed frontend using React.js. Designed UI for voice interaction.
Connected frontend with backend APIs. Implemented voice input handling.
Built chat display components. Improved UI responsiveness.
## Week 4
Implemented Text-to-Speech module. Added multilingual support.
Improved intent accuracy. Enhanced routing logic. Optimized API
responses. Fixed bugs and tested modules.
## Week 5
Developed healthcare tools (symptom checker). Integrated external medical
APIs. Implemented Redis caching. Improved reliability. Conducted
performance testing. Refined workflow.
## Week 6
Performed system integration. Tested all modules. Fixed bugs and improved
performance. Enhanced error handling. Strengthened security. Prepared
documentation.
## Week 7
Deployed application. Conducted final testing. Optimized deployment.
Prepared report and presentation. Demonstrated system. Collected feedback
and finalized project.

## 33

## KRISHNAPRASATH SK (7376232CCB127)

## Week Description
## Week 1
Built frontend using React and Vite. Created responsive UI. Added
voice input. Integrated APIs. Developed classifier UI. Built news
module. Designed dashboards. Improved layout. Handled validation.
Tested UI.
## Week 2
Improved UI responsiveness. Refined API calls. Enhanced voice
interaction. Added loading states. Fixed UI bugs. Improved
navigation.
## Week 3
Optimized performance. Improved components. Enhanced
dashboards. Fixed errors. Tested UI.
## Week 4
Added new UI features. Improved design consistency. Enhanced
accessibility. Fixed integration issues.
## Week 5
Improved modules. Enhanced real-time updates. Refined interaction
flow. Tested components.
## Week 6
Performed UI testing. Fixed bugs. Improved compatibility. Optimized
performance.
## Week 7
Finalized UI. Assisted deployment. Tested system. Improved based
on feedback.

## 34

## KAMALESH V (7376232CT118)

## Week Description
## Week 1
Designed database using PostgreSQL. Implemented Redis caching.
Built health monitoring module. Developed clinic finder using
OpenStreetMap. Managed data storage and retrieval. Tested system
performance. Fixed issues. Assisted deployment. Prepared
documentation. Collected feedback.
## Week 2
Improved database queries. Optimized caching. Enhanced health
module. Refined clinic finder. Fixed bugs. Improved data handling.
## Week 3
Optimized performance. Improved storage mechanisms. Enhanced
module accuracy. Tested system. Fixed errors.
## Week 4
Added new features. Improved database design. Enhanced API
integration. Fixed issues.
## Week 5
Improved modules. Optimized queries. Enhanced caching. Tested
performance.
## Week 6
Performed system testing. Fixed bugs. Improved reliability. Assisted
deployment.
## Week 7
Finalized modules. Completed deployment. Tested system. Updated
documentation. Improved based on feedback.

## 35

## PLAGARISM REPORT
