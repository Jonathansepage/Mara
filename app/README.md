## Browserift Template ##

Framework Template using browserify and gulp.

# Getting Started #

1. Edit .htaccess RewriteBase to your project folder on line 34
> RewriteBase /YourProjectFolder/

2. Edit assets/js/app.js _ROOT to your project folder on line 5
> window._ROOT = '/YourProjectFolder/'; 

3. Open Terminal and navigate to the project (from finder, drag and drop folder onto terminal application icon).
Install project depencies as listed in package.json (requires node and npm to be installed)
> npm install

4. Run Gulp to do a first build and to launch watchify (instructions listed in gulpfile.js)
> gulp

5. Open your project in a browser.

6. Edit any files, and the watchify should rebuild the project automatically (assets/js/bundle.js).
If gulpfile.js edited, cancel the process in terminal and relaunch it
> ctrl + c
> gulp

7. Minify sources to buil the final app version
> ctrl + c
> gulp prod
