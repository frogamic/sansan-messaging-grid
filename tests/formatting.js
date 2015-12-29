var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var formatting = require('../formatting');

var testCards = [
    { "code":"01033", "title":"Kate \"Mac\" McCaffrey: Digital Tinker", "type":"Identity", "subtype":"Natural", "text":"Lower the install cost of the first program or piece of hardware you install each turn by 1.", "baselink":1, "faction":"Shaper", "influencelimit":15, "minimumdecksize":45, "number":33, "side":"Runner", "uniqueness":false, "cyclenumber":1, "url":"http:\/\/netrunnerdb.com\/en\/card\/01033", "imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/01033.png" },
    { "code":"08012", "title":"Jinteki Biotech: Life Imagined", "type":"Identity", "subtype":"Division", "text":"Before taking your first turn, you may swap this card with any copy of Jinteki Biotech.\r\n[Click],[Click],[Click]: Flip this identity.\r\nThe Brewery: When you flip this identity, do 2 net damage.\r\nThe Tank: When you flip this identity, shuffle Archives into R&D.\r\nThe Greenhouse: When you flip this identity, place 4 advancement tokens on a card that can be advanced.", "faction":"Jinteki", "influencelimit":15, "minimumdecksize":45, "number":12, "side":"Corp", "uniqueness":false, "cyclenumber":8, "url":"http:\/\/netrunnerdb.com\/en\/card\/08012", },
    {"code":"05037","title":"Logos","type":"Hardware","subtype":"Console","text":"+1[Memory Unit]\r\nYour maximum hand size is increased by 1.\r\nWhenever the Corp scores an agenda, you may search your stack for a card and add it to your grip. Shuffle your stack.\r\nLimit 1 <strong>console<\/strong> per player.","cost":4,"faction":"Criminal","factioncost":2,"number":37,"side":"Runner","uniqueness":true,"cyclenumber":5,"url":"http:\/\/netrunnerdb.com\/en\/card\/05037"},
    {"code":"01013","title":"Wyrm","type":"Program","subtype":"Icebreaker - AI","text":"3[Credits]: Break ice subroutine on a piece of ice with 0 or less strength.\r\n1[Credits]: Ice has \u22121 strength.\r\n1[Credits]: +1 strength.","cost":1,"faction":"Anarch","factioncost":2,"memoryunits":1,"number":13,"side":"Runner","strength":1,"uniqueness":false,"cyclenumber":1,"url":"http:\/\/netrunnerdb.com\/en\/card\/01013"},
    {"code":"02067","title":"All-nighter","type":"Resource","text":"[Click], [Trash]: Gain [Click][Click].","cost":0,"faction":"Shaper","factioncost":2,"number":67,"side":"Runner","uniqueness":false,"cyclenumber":2,"url":"http:\/\/netrunnerdb.com\/en\/card\/02067"},
    {"last-modified":"2015-01-23T13:12:08+00:00","code":"01002","title":"D\u00e9j\u00e0 Vu","type":"Event","type_code":"event","subtype":"","subtype_code":"","text":"Add 1 card (or up to 2 <strong>virus<\/strong> cards) from your heap to your grip.","cost":2,"faction":"Anarch","faction_code":"anarch","faction_letter":"a","factioncost":2,"flavor":"Anything worth doing is worth doing twice.","illustrator":"Tim Durning","number":2,"quantity":2,"setname":"Core Set","set_code":"core","side":"Runner","side_code":"runner","uniqueness":false,"limited":3,"cyclenumber":1,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/D%C3%A9j%C3%A0_Vu","url":"http:\/\/netrunnerdb.com\/en\/card\/01002","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/01002.png"},
    {"last-modified":"2015-10-29T08:43:51+00:00","code":"08100","title":"Vanity Project","type":"Agenda","type_code":"agenda","subtype_code":"","advancementcost":6,"agendapoints":4,"faction":"Neutral","faction_code":"neutral","faction_letter":"-","factioncost":1,"flavor":"EXT. KANSAS \u2013 DAY\r\nDOROTHY (Miranda) gazes out at the horizon. A sudden gust of wind catches her hair. Above the windblasted prairie loom ominous STORM CLOUDS.\r\nDOROTHY: If only I wasn't in Kansas anymore. \r\nShe begins to hum a haunting melody.","illustrator":"Ashley Witter","number":100,"quantity":3,"setname":"Old Hollywood","set_code":"oh","side":"Corp","side_code":"corp","uniqueness":false,"limited":3,"cyclenumber":8,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/Vanity_Project","url":"http:\/\/netrunnerdb.com\/en\/card\/08100","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/08100.png"},
    {"last-modified":"2015-06-02T09:40:20+00:00","code":"07009","title":"Mark Yale","type":"Asset","type_code":"asset","subtype":"Executive","subtype_code":"executive","text":"Whenever you spend an agenda counter, gain 1[Credits].\r\n[Trash] or <strong>any agenda counter<\/strong>: Gain 2[Credits].","cost":1,"faction":"Weyland Consortium","faction_code":"weyland-consortium","faction_letter":"w","factioncost":1,"flavor":"\"This is a one-of-a-kind opportunity\u2026\"","illustrator":"Ralph Beisner","number":9,"quantity":3,"setname":"Order and Chaos","set_code":"oac","side":"Corp","side_code":"corp","trash":3,"uniqueness":true,"limited":3,"cyclenumber":7,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/Mark_Yale","url":"http:\/\/netrunnerdb.com\/en\/card\/07009","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/07009.png"},
    {"last-modified":"2015-01-19T09:43:15+00:00","code":"06112","title":"Self-destruct","type":"Upgrade","type_code":"upgrade","subtype":"","subtype_code":"","text":"Install only in a remote server.\r\n[Trash]: Trash all cards installed in or protecting this server and <strong>trace<sup>X<\/sup><\/strong>\u2013 if successful, do 3 net damage. X is the number of cards trashed. Use this ability only during a run on this server.","cost":2,"faction":"Neutral","faction_code":"neutral","faction_letter":"-","factioncost":0,"flavor":"","illustrator":"Alexandr Elichev","number":112,"quantity":3,"setname":"The Source","set_code":"ts","side":"Corp","side_code":"corp","trash":0,"uniqueness":false,"limited":3,"cyclenumber":6,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/Self-destruct","url":"http:\/\/netrunnerdb.com\/en\/card\/06112","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/06112.png"},
    {"last-modified":"2015-06-02T10:04:47+00:00","code":"08035","title":"Recruiting Trip","type":"Operation","type_code":"operation","subtype_code":"","text":"Search R&D for up to X different <strong>sysops<\/strong> (by title), reveal them, and add them to HQ. Shuffle R&D.","cost":0,"faction":"Jinteki","faction_code":"jinteki","faction_letter":"j","factioncost":1,"flavor":"\"My script can perform the Kobayashi algorithm in .12 seconds.\"","illustrator":"Dmitry Prosvimin","number":35,"quantity":3,"setname":"Breaker Bay","set_code":"bb","side":"Corp","side_code":"corp","uniqueness":false,"limited":3,"cyclenumber":8,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/Recruiting_Trip","url":"http:\/\/netrunnerdb.com\/en\/card\/08035","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/08035.png"},
    {"last-modified":"2015-01-23T13:12:08+00:00","code":"01088","title":"Data Raven","type":"ICE","type_code":"ice","subtype":"Sentry - Tracer - Observer","subtype_code":"sentry - tracer - observer","text":"When the Runner encounters Data Raven, he or she must either take 1 tag or end the run.\r\n<strong>Hosted power counter:<\/strong> Give the Runner 1 tag.\r\n[Subroutine] <strong>Trace<sup>3<\/sup><\/strong>\u2013 If successful, place 1 power counter on Data Raven.","cost":4,"faction":"NBN","faction_code":"nbn","faction_letter":"n","factioncost":2,"flavor":"","illustrator":"Gong Studios","number":88,"quantity":3,"setname":"Core Set","set_code":"core","side":"Corp","side_code":"corp","strength":4,"uniqueness":false,"limited":3,"cyclenumber":1,"ancurLink":"http:\/\/ancur.wikia.com\/wiki\/Data_Raven","url":"http:\/\/netrunnerdb.com\/en\/card\/01088","imagesrc":"\/bundles\/netrunnerdbcards\/images\/cards\/en\/01088.png"}
];

describe('Card-text formatting', function() {
    it('should return a string', function (done) {
        expect(formatting.formatText('blah')).to.be.a('string');
        done();
    });
    it('should replace all click, trash and link symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('[Click][Click]\n [Trash] 2 [Link]')
              ).to.equal(':_click::_click:\n :_trash: 2 :_link:');
        done();
    });
    it('should replace all credit symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('1[Credits] \n2[Credits] 3[Recurring Credits]')
              ).to.equal('1:_credit: \n2:_credit: 3:_recurringcredit:');
        done();
    });
    it('should replace subroutine symbols with emoji and insert newlines where appropriate', function (done) {
        expect(
            formatting.formatText('[Subroutine] End the run.\r\n[Subroutine] End the run.')
             ).to.equal(':_subroutine: End the run.\n:_subroutine: End the run.');
        done();
    });
    it('should replace all memory symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('+1[Memory Unit] +2[Memory Unit]\n +3[Memory Unit] +4[Memory Unit] +X[Memory Unit] [Memory Unit]')
              ).to.equal('+:_1mu: +:_2mu:\n +:_3mu: +:_4mu: +:_xmu: :_mu:');
        done();
    });
    it('should add newlines to card text where appropriate', function (done) {
        expect(
            formatting.formatText('1[Credits]: do a thing.\r\n2[Credits], [Trash]: do something else')
              ).to.equal('1:_credit:: do a thing.\n2:_credit:, :_trash:: do something else');
        done();
    });
    it('should replace HTML bolding with slack bolding', function (done) {
        expect(
            formatting.formatText('<strong>Bold Text!!</strong>')
              ).to.equal('*\u200bBold Text!!\u200b*');
        done();
    });
    it('should replace HTML superscript with unicode superscript', function (done) {
        expect(
            formatting.formatText('[Subroutine] <strong>Trace<sup>1234567890X</sup></strong>– If successful, trash a piece of hardware. If your trace strength is 5 or greater, trash a piece of hardware with a cost of 1[Credits].')
              ).to.equal(':_subroutine: *\u200bTrace¹²³⁴⁵⁶⁷⁸⁹⁰ˣ\u200b*– If successful, trash a piece of hardware. If your trace strength is 5 or greater, trash a piece of hardware with a cost of 1:_credit:.');
        done();
    });
});



describe('Card title formatting', function() {
    it('should return a string without being passed a url', function (done) {
        expect(formatting.formatTitle('blah', 'www.example.com')).to.be.a('string');
        done();
    });
    it('should return a string when passed a url', function (done) {
        expect(formatting.formatTitle('blah')).to.be.a('string');
        done();
    });
    it('should create titles with URLs', function (done) {
        expect(formatting.formatTitle('NBN: The World is Yours*', 'http://netrunnerdb.com/en/card/02114'))
            .to.equal('<http://netrunnerdb.com/en/card/02114|*\u200bNBN: The World is Yours*\u200b*>');
        done();
    });
    it('should create titles without URLs', function (done) {
        expect(formatting.formatTitle('NBN: The World is Yours*'))
            .to.equal('*\u200bNBN: The World is Yours*\u200b*');
        done();
    });
});



describe('Card formatting', function () {
    it('should correctly format Identities', function (done) {
        expect(formatting.formatCards([testCards[0]])).to.deep.equal({
            text: "<http://netrunnerdb.com/en/card/01033|*\u200bKate \"Mac\" McCaffrey: Digital Tinker\u200b*>", attachments: [ { pretext: "*\u200bIdentity:\u200b* Natural - :_shaper:\n1 :_link: - 45 :_deck: - 15• - _\u200bCore Set\u200b_", text: "Lower the install cost of the first program or piece of hardware you install each turn by 1.", mrkdwn_in: [ "pretext", "text" ], color: "#47d147", thumb_url: "undefined01033.png" } ]
        });
        expect(formatting.formatCards([testCards[1]])).to.deep.equal({
            text: "<http://netrunnerdb.com/en/card/08012|*\u200bJinteki Biotech: Life Imagined\u200b*>", attachments: [ { pretext: "*\u200bIdentity:\u200b* Division - :_jinteki:\n45 :_deck: - 15• - _\u200bThe Valley\u200b_", text: "Before taking your first turn, you may swap this card with any copy of Jinteki Biotech.\n:_click:,:_click:,:_click:: Flip this identity.\nThe Brewery: When you flip this identity, do 2 net damage.\nThe Tank: When you flip this identity, shuffle Archives into R&amp;D.\nThe Greenhouse: When you flip this identity, place 4 advancement tokens on a card that can be advanced.", mrkdwn_in: [ "pretext", "text" ], color: "#ff0000", thumb_url: "undefined08012.png" } ]
        });
        done();
    });

    it('should correctly format hardware', function (done) {
        expect(formatting.formatCards([testCards[2]])).to.deep.equal({
            text: "<http://netrunnerdb.com/en/card/05037|*\u200b◆ Logos\u200b*>", attachments: [ { pretext: "*\u200bHardware:\u200b* Console - :_criminal:••\n4:_credit: - _\u200bHonor and Profit\u200b_", text: "+:_1mu:\nYour maximum hand size is increased by 1.\nWhenever the Corp scores an agenda, you may search your stack for a card and add it to your grip. Shuffle your stack.\nLimit 1 *\u200bconsole\u200b* per player.", mrkdwn_in: [ "pretext", "text" ], color: "#0066cc", thumb_url: "undefined05037.png" } ]
        });
        done();
    });

    it('should correctly format programs', function (done) {
        expect(formatting.formatCards([testCards[3]])).to.deep.equal({
            text: "<http://netrunnerdb.com/en/card/01013|*\u200bWyrm\u200b*>", attachments: [ { pretext: "*\u200bProgram:\u200b* Icebreaker - AI - :_anarch:••\n1:_credit: - :_1mu: - 1 str - _\u200bCore Set\u200b_", text: "3:_credit:: Break ice subroutine on a piece of ice with 0 or less strength.\n1:_credit:: Ice has −1 strength.\n1:_credit:: +1 strength.", mrkdwn_in: [ "pretext", "text" ], color: "#ff531a", thumb_url: "undefined01013.png" } ]
            });
        done();
    });

    it('should correctly format resources', function (done) {
        expect(formatting.formatCards([testCards[4]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/02067|*\u200bAll-nighter\u200b*>","attachments":[{"pretext":"*\u200bResource\u200b* - :_shaper:••\n0:_credit: - _\u200bA Study in Static\u200b_","text":":_click:, :_trash:: Gain :_click::_click:.","mrkdwn_in":["pretext","text"],"color":"#47d147", thumb_url: "undefined02067.png" }]
        });
        done();
    });

    it('should correctly format events', function (done) {
        expect(formatting.formatCards([testCards[5]])).to.deep.equal({"text":"<http://netrunnerdb.com/en/card/01002|*\u200bDéjà Vu\u200b*>","attachments":[{"pretext":"*\u200bEvent\u200b* - :_anarch:••\n2:_credit: - _\u200bCore Set\u200b_","text":"Add 1 card (or up to 2 *\u200bvirus\u200b* cards) from your heap to your grip.","mrkdwn_in":["pretext","text"],"color":"#ff531a", thumb_url: "undefined01002.png" }]
        });
        done();
    });

    it('should correctly format agendas', function (done) {
        expect(formatting.formatCards([testCards[6]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/08100|*\u200bVanity Project\u200b*>","attachments":[{"pretext":"*\u200bAgenda\u200b* - :_neutral:•\n6 :_advance: - 4 :_agenda: - _\u200bOld Hollywood\u200b_","mrkdwn_in":["pretext","text"],"color":"#808080", thumb_url: "undefined08100.png" }]
        });
        done();
    });

    it('should correctly format assets', function (done) {
        expect(formatting.formatCards([testCards[7]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/07009|*\u200b◆ Mark Yale\u200b*>","attachments":[{"pretext":"*\u200bAsset:\u200b* Executive - :_weyland:•\n1 :_rez: - 3 :_trash: - _\u200bOrder and Chaos\u200b_","text":"Whenever you spend an agenda counter, gain 1:_credit:.\n:_trash: or *\u200bany agenda counter\u200b*: Gain 2:_credit:.","mrkdwn_in":["pretext","text"],"color":"#287c64", thumb_url: "undefined07009.png" }]
        });
        done();
    });

    it('should correctly format upgrades', function (done) {
        expect(formatting.formatCards([testCards[8]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/06112|*\u200bSelf-destruct\u200b*>","attachments":[{"pretext":"*\u200bUpgrade\u200b* - :_neutral:\n2 :_rez: - 0 :_trash: - _\u200bThe Source\u200b_","text":"Install only in a remote server.\n:_trash:: Trash all cards installed in or protecting this server and *\u200btraceˣ\u200b*– if successful, do 3 net damage. X is the number of cards trashed. Use this ability only during a run on this server.","mrkdwn_in":["pretext","text"],"color":"#808080", thumb_url: "undefined06112.png" }]
        });
        done();
    });

    it('should correctly format operations', function (done) {
        expect(formatting.formatCards([testCards[9]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/08035|*\u200bRecruiting Trip\u200b*>","attachments":[{"pretext":"*\u200bOperation\u200b* - :_jinteki:•\n0:_credit: - _\u200bBreaker Bay\u200b_","text":"Search R&amp;D for up to X different *\u200bsysops\u200b* (by title), reveal them, and add them to HQ. Shuffle R&amp;D.","mrkdwn_in":["pretext","text"],"color":"#ff0000", thumb_url: "undefined08035.png" }]
        });
        done();
    });

    it('should correctly format ICE', function (done) {
        expect(formatting.formatCards([testCards[10]])).to.deep.equal({
            "text":"<http://netrunnerdb.com/en/card/01088|*\u200bData Raven\u200b*>","attachments":[{"pretext":"*\u200bICE:\u200b* Sentry - Tracer - Observer - :_nbn:••\n4 :_rez: - 4 str - _\u200bCore Set\u200b_","text":"When the Runner encounters Data Raven, he or she must either take 1 tag or end the run.\n*\u200bHosted power counter:\u200b* Give the Runner 1 tag.\n:_subroutine: *\u200bTrace³\u200b*– If successful, place 1 power counter on Data Raven.","mrkdwn_in":["pretext","text"],"color":"#ffb900", thumb_url: "undefined01088.png" }]
        });
        done();
    });

    it('should correctly format multiple cards', function (done) {
        expect(formatting.formatCards(testCards.slice(0,2))).to.deep.equal({
            text: "<http://netrunnerdb.com/en/card/01033|*\u200bKate \"Mac\" McCaffrey: Digital Tinker\u200b*>", attachments: [
                { pretext: "*\u200bIdentity:\u200b* Natural - :_shaper:\n1 :_link: - 45 :_deck: - 15• - _\u200bCore Set\u200b_", text: "Lower the install cost of the first program or piece of hardware you install each turn by 1.", mrkdwn_in: [ "pretext", "text" ], color: "#47d147", thumb_url: "undefined01033.png" },
                { pretext: "<http://netrunnerdb.com/en/card/08012|*\u200bJinteki Biotech: Life Imagined\u200b*>\n*\u200bIdentity:\u200b* Division - :_jinteki:\n45 :_deck: - 15• - _\u200bThe Valley\u200b_", text: "Before taking your first turn, you may swap this card with any copy of Jinteki Biotech.\n:_click:,:_click:,:_click:: Flip this identity.\nThe Brewery: When you flip this identity, do 2 net damage.\nThe Tank: When you flip this identity, shuffle Archives into R&amp;D.\nThe Greenhouse: When you flip this identity, place 4 advancement tokens on a card that can be advanced.", mrkdwn_in: [ "pretext", "text" ], color: "#ff0000", thumb_url: "undefined08012.png" } ]
        });
        done();
    });
});

