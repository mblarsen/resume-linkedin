var config = require('./config'),
  LinkedIn = require('node-linkedin')(config.apiKey, config.secretKey, config.host + '/oauth/linkedin/callback'),
  express = require('express'),
  fs = require('fs'),
  resumeSchema = require('resume-schema'),
  log = require('debug')('resume'),
  app = express(),
  server;
  
// Middleware
var cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  session = require('express-session'),
  consolidate = require('consolidate');
  
app.engine('html', consolidate.jade);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
  secret: 'whistleblown',
  saveUninitialized: true,
  resave: true
}));

var resume = {
  "bio": {
    "email": { },
    "phone": { },
    "location": { },
    "websites": { },
    "profiles": { }
  },
  "work": [ ],
  "education": [ ],
  "awards": [ ],
  "publications": [ ],
  "skills": [ ],
  "references": [ ]
};

function makeDate(dateObj, isCurrent) {
  if (isCurrent !== undefined && isCurrent.valueOf() === true) {
    return '';
  }
  if (dateObj.length === 3) {
    return [dateObj.year, dateObj.month, dateObj.day].join('-');
  }
  return [dateObj.year, dateObj.month, '01'].join('-');
}

function makeResume($in) {
  log('making resume');
  resume.bio.firstName = $in.firstName;
  resume.bio.lastName = $in.lastName;
  resume.bio.email.personal = $in.emailAddress;
  resume.bio.profiles.twitter = $in.primaryTwitterAccount.providerAccountName;
  resume.bio.websites.linkedIn = $in.publicProfileUrl;
  resume.bio.summary = $in.summary;
  
  var i, max, collection, collectionKey, obj;
  
  // Recommendations
  collection = $in.recommendationsReceived.values;
  collectionKey = 'references';
  for (i = 0, max = collection.length; i < max; i += 1) {
    obj = {
      name: collection[i].recommender.firstName + ' ' + collection[i].recommender.lastName,
      reference: collection[i].recommendationText
    };
    log('adding reference from ' + obj.name);
    resume[collectionKey].push(obj);
  }

  // Publications
  collection = $in.publications.values;
  collectionKey = 'publications';
  for (i = 0, max = collection.length; i < max; i += 1) {
    obj = { 
      name: collection[i].title,
      releaseDate: makeDate(collection[i].date),
      publisher: '',
      website: ''
    };
    log('adding publication ' + obj.name);
    resume[collectionKey].push(obj);
  }

  // Phones
  collection = $in.phoneNumbers.values;
  collectionKey = 'phone';
  for (i = 0, max = collection.length; i < max; i += 1) {
    log('adding phone ' + collection[i].phoneType + ' ' + collection[i].phoneNumber);
    resume.bio[collectionKey][collection[i].phoneType] = collection[i].phoneNumber;
  }
  
  // Jobs
  collection = $in.positions.values;
  collectionKey = 'work';
  for (i = 0, max = collection.length; i < max; i += 1) {
    obj = {
      company: collection[i].company.name,
      position: collection[i].title,
      website: '',
      startDate: makeDate(collection[i].startDate),
      endDate: makeDate(collection[i].startDate, Boolean(collection[i].isCurrent)),
      summary: collection[i].summary,
      highlights: []
    };
    log('adding work ' + obj.company);
    resume[collectionKey].push(obj);
  }

  // Education
  collection = $in.educations.values;
  collectionKey = 'education';
  for (i = 0, max = collection.length; i < max; i += 1) {
    obj = {
      institution: collection[i].schoolName,
      startDate: makeDate(collection[i].startDate),
      endDate: makeDate(collection[i].endDate, collection[i].isCurrent),
      area: collection[i].fieldOfStudy,
      summary: collection[i].notes,
      studyType: collection[i].degree,
      courses: []
    };
    log('adding education ' + obj.studyType + '@' + obj.institution);
    resume[collectionKey].push(obj);
  }
  
  // Skills
  collection = $in.skills.values;
  collectionKey = 'skills';
  for (i = 0, max = collection.length; i < max; i += 1) {
    obj = {
      name: collection[i].skill.name,
      level: 'beginner|intermediate|master',
      keywords: []
    };
    log('adding skill ' + obj.name);
    resume[collectionKey].push(obj);
  }
  return resume;
};

app.get('/', function(req, res) {
  if (req.session.accessToken) {
    var linkedIn = LinkedIn.init(req.session.accessToken);
    linkedIn.people.me(function(err, $in) {
      req.session.$in = $in;
      resume = makeResume($in);
      resumeSchema.validate(resume, function (result, validationErr) {
        var exitCode = 0;
        if (validationErr || result.valid !== true) {
          console.error(validationErr);
          console.error(result);
          exitCode = 1;
        } else {
          var resumeString = JSON.stringify(resume, undefined, 2);
          log('saving file resume.json:' + resumeString.length);
          fs.writeFileSync(__dirname + '/resume.json', resumeString);
          console.log('Done!');
        }
        res.render('index', { accessToken: req.session.accessToken, resume: resume, result: result });
        process.exit(exitCode);
      });
    });
  } else {
    console.log('Click Authorize with LinkedIn to continue');
    res.render('index', { accessToken: req.session.accessToken, resume: resume, error: req.session.error, errorMsg: req.session.errorMsg });
  }
});

app.get('/oauth/linkedin', function(req, res) {
  console.log('Good, authorizing');
  LinkedIn.auth.authorize(res, ['r_basicprofile', 'r_fullprofile', 'r_emailaddress', 'r_contactinfo']);
});

app.get('/oauth/linkedin/callback', function(req, res) {
  console.log('Requesting access token');
  LinkedIn.auth.getAccessToken(res, req.query.code, function(err, data) {
    if (err) return console.error(err);
    log(data);
    var result = JSON.parse(data);
    if (typeof result.error !== 'undefined') {
      req.session.error = result.error;
      req.session.errorMsg = result.error_description;
    } else {
      req.session.accessToken = result.access_token;
      console.log('Access token acquired, getting profile');
      log(req.session.accessToken);
    }
    return res.redirect('/');
  });
});

app.use(function(err, req, res, next) {
  if (err) console.error(err);
  next();
});

server = app.listen(80);
console.log('Go visit ' + config.host + ' in your browser');
