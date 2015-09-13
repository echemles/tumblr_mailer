var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
var emailFile = fs.readFileSync("email_template.ejs","utf8")

var client = tumblr.createClient({
  consumer_key: '',
  consumer_secret: '',
  token: '',
  token_secret: ''
});

function csvParse(file){
  file = file.split("\n");
  var parsedArr = [], thisObj, i;
  var labels = file[0].split(",");
  file = file.slice(1).forEach(function(person){
    thisObj = {};
    person = person.split(',');
    for(i=0; i<labels.length; i++){
      thisObj[labels[i]] = person[i];
    }
    parsedArr.push(thisObj);
  });
  return parsedArr;
}

var contacts = csvParse(csvFile)


function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
};



/*

function fillEmail(name, months){
  emailFile = emailFile.replace("FIRST_NAME", name).replace("NUM_MONTHS_SINCE_CONTACT", months);
}

fillEmail(csv_data[0]['firstName'],csv_data[0]['numMonthsSinceContact']);

var template = "Hi <%= firstName %>, I can't believe I haven't seen you for <%= numMonthsSinceContact %>! We really gotta keep in touch better.\n Anyway, hit me up sometime and let's grab a cup of joe.\n David"

var emailTemplate = ejs.render(template, csv_data)
*/

client.posts('lesterechem.tumblr.com', function(err, blog){
  var today = Date.now() / 1000 | 0;
  function lessThan7Days(post){
    return today - Number(post.timestamp) < 604800; //seconds in 1 week
  }
  var latestPosts = blog.posts.filter(lessThan7Days);

  contacts.forEach(function(contact){
    var to_name = contact.firstName + " " + contact.lastName;
    var to_email = contact.emailAddress;
    var from_name = "Lester Echem";
    var from_email = "lesterechem@gmail.com";
    var subject = "Journey into Coding";
    contact.latestPosts = latestPosts;
    var personalizedBody = ejs.render(emailFile, contact)
    sendEmail(to_name, to_email, from_name, from_email, subject, personalizedBody)
  });
})