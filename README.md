# [DEPRECATED] JSON resume LinkedIn builder

**Deprecated due to changes in LinkedIn API**

[![Dependencies](http://img.shields.io/david/mblarsen/resume-linkedin.svg
)](https://david-dm.org/mblarsen/resume-linkedin) ![NPM version](http://img.shields.io/npm/v/resume-linkedin.svg)

[![NPM](https://nodei.co/npm/resume-linkedin.png?downloads=true)](https://nodei.co/npm/resume-linkedin/)

Builds a valid `resume.json` file based on http://jsonresume.org/ schema by drawing data from your LinkedIn profile ([example](http://registry.jsonresume.org/mblarsen)).


After building you can publish your resume using:

    resume publish

(given you have `resume-cli` installed globally)

## Install

```
git clone https://github.com/mblarsen/resume-linkedin.git
```

or

```
npm install resume-linkedin ; cd resume-linkedin
```

## Usage

Setup an application on [LinkedIn](https://www.linkedin.com/secure/developer).

1. __OAuth 2.0 Redirect URLs__ enter a callback URL, the host can be anything (we'll add the host to your hosts file), but the path must be `/oauth/linkedin/callback`. E.g. `http://resume.example.com/oauth/linkedin/callback`.

2. Edit the config.js file and enter you __API Key__ and __Secret Key__. In host enter the same value you used above. E.g. `http://resume.example.com/`.

3. Add a line with host to to `/etc/hosts/`. E.g. `127.0.0.1 resume.example.com`

4. `npm start` and follow instructions.

5. Adjust your resume. It is likely that the _skills_ section needs work.

6. Profit!

## TODO

* Error and validation handling.
* Make it run headless.
