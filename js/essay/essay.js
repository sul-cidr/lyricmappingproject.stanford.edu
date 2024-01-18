export function createEssay(path) {
  if (path === "home") {
    document.getElementById("essayContent").innerHTML = createIntroHtml();
    document.getElementById('creditsLink').addEventListener('click', () => createEssay("credits"));
  } else if (path === "credits") {
    document.getElementById("essayContent").innerHTML = createCreditsHtml();
    document.getElementById("homeLink").addEventListener('click', () => createEssay("home"));
  } else {
    alert("unrecognized path in createEssay");
  }
}

export function initializeCloseEssayClicks() {
  ["essayTitle", "essayCloseButton", "wholeScreen"].forEach(id => {
    document.getElementById(id).addEventListener('click', closeEssay);
  })
}

function closeEssay() {
  document.getElementById("essayBox").classList.add("hideEssay");
  document.getElementById("essayContent").classList.add("hideEssay");
}

function createIntroHtml() {
  return (`
  <div id="intro-top">
   	<h2>Mapping Greek Lyric: Places, Travel, Geographical Imaginary</h2>
	  <p>This project is the first-ever attempt to illustrate on an interactive map key geocultural aspects of the rich lyric production that was generated and spread throughout the Greek world from the 8<sup>th</sup> to the beginning of the 4<sup>th</sup> century BC. We report and display data based on the ancient sources, without judging whether they are all historically accurate. It is the users’ responsibility to explore further.</p>
	  <p>The composition of <i>melic</i>, <i>elegiac</i> and <i>iambic</i> poetry, all included here under the term <i>lyric</i>, was a crucial component of Greek musical cultures. As <i>mousike</i>, with its various combinations of vocal, instrumental and kinetic activity, was a cornerstone in forming sensibilities and establishing ideologies, our project aspires to be a useful tool for all those interested in exploring the local origins and mobile dynamics of performance and culture in the ancient world. 
	  <p>Created and implemented by David Driscoll, designed and researched by David Driscoll, Israel McMullin, Stephen Sansom, maintained by Sinead Brennan-McMahon, headed by Anastasia-Erasmia Peponi.</p>
	  <p style="font-size: small">Please cite as: D. Driscoll, I. McMullin, S. Sansom, S. Brennan-McMahon, A.-E. Peponi. <i>Mapping Greek Lyric : Places, Travel, Geographical Imaginary</i> [Date of access] (<a href="https://lyricmappingproject.stanford.edu">https://lyricmappingproject.stanford.edu</a>)</p>
  </div>
  <div id="intro-bottom" class="flex-wrapper" style="justify-content: center;">
	  <div id="bottom-center" class="box-column">
		  <iframe id="youtubeVideo" src="https://www.youtube.com/embed/XvlZzQkwy1Y?rel=0&autoplay=0" allowfullscreen title="Youtube video demonstrating use of the map"></iframe><br>
		  <a href="#" id="creditsLink">Credits and Acknowledgements</a></p>
	  </div>
  </div>
  `);
}

function createCreditsHtml() {
  return (`
  <h2>Works Cited:</h2>
  <p>Aspiotes, Nikolaos. 2006. <em>Prosopographia Musica Graeca: Personenlexikon Mit Daten Zu 2350 (heidnischen) Musikern</em>. Berlin: Frank &amp; Timme.</p>
  <p>Babbitt, F. C. 1936. <em>Plutarch: Moralia, Volume IV, Roman Questions. Greek Questions. Greek and Roman Parallel Stories</em>. Harvard University Press.</p>
  <p>Beazley, J. D. 1963. <em>Attic Red-Figure Vase-Painters</em>. Oxford: Oxford University Press.</p>
  <p>Campbell, David. 1982&ndash;1993. <em>Greek Lyric. Vols. 1&ndash;5</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Cancik, Hubert, Francis G. Gentry, Manfred Landfester, August Pauly, and Helmuth Schneider, ed. 1996&ndash;2009. <em>Brill&rsquo;s New Pauly: Encyclopaedia of the Ancient World</em>. Leiden: Brill.</p>
  <p>Fantuzzi, Marco, and Richard Hunter. 2005. <em>Tradition and Innovation in Hellenistic Poetry</em>. Cambridge: Cambridge University Press.</p>
  <p>Gerber, Douglas E., ed. 1999a. <em>Greek Iambic Poetry: From the Seventh to the Fifth Centuries B.C</em>. 2 edition. Cambridge, Mass.: Harvard University Press.</p>
  <p>&mdash;&mdash;&mdash;. 1999b. <em>Greek Elegiac Poetry: From the Seventh to the Fifth Centuries B.C</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Hansen, Mogens, and Thomas Nielsen. 2005<em>. An Inventory of Archaic and Classical Poleis</em>. New York: Oxford University Press.</p>
  <p>Hansen, P. A. 1983. <em>Carmina Epigraphica Graeca</em>. Berlin: De Gruyter.</p>
  <p>Henderson, Jeffrey, ed. 1995&ndash;2007. <em>Aristophanes. Vols. 1&ndash;5</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Hicks, R. D., ed. 1925. <em>Diogenes Laertius: Lives of Eminent Philosophers, Vols. 1-2</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Hondius, Jacobus Johannes Ewoud, Arthur Geoffrey Woodhead, G&uuml;nther Klaffenbach, Pierre Roussel, H. W. Pleket, Ronald S. Stroud, and Aggelos Chaniōtēs. 1923&ndash;. <em>Supplementum Epigraphicum Graecum</em>. Gieben.</p>
  <p>Hutton, William, Elizabeth Vandiver, Ross Scaife, Raphael Finkel, and Patrick Rourke, ed. 1998&ndash;2014. <em>Suda On Line</em>. Center for Computing in the Humanities: http://www.stoa.org/sol/.</p>
  <p>Jones, H. L. 1917&ndash;1932. <em>Strabo: Geography. Vols. 1&ndash;8</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Lefkowitz, Mary R. 2012. <em>The Lives of the Greek Poets</em>. 2nd Ed. Baltimore: Johns Hopkins University Press.</p>
  <p>Oldfather, Charles H., ed. 1933&ndash;1967. <em>Diodorus of Sicily: Library of History. Vols. 1&ndash;12</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Olson, S. Douglas. 2007&ndash;2012. <em>The Learned Banqueters. Vols. 1&ndash;8</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Race, William H. 1997. <em>Pindar. Vols. 1&ndash;2</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Russell, D. A. 2002. <em>Quintilian: The Orator&rsquo;s Education, V, Books 11-12</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>Rutherford, Ian. 2001. <em>Pindar's Paeans: A Reading of the Fragments with a Survey of the Genre</em>. Oxford: Oxford University Press.</p>
  <p>Searchable Greek Inscriptions (<em>Inscriptiones Graecae</em>). 2015. The Packard Humanities Institute: http://epigraphy.packhum.org.</p>
  <p style="font-family: 'Times New Roman'">Στεφανής, Ι. 1988. <em>Διονυσιακοί τεχνίται: συμβολές στην προσωπογραφία του θεάτρου και της μουσικής των αρχαίων Ελλήνων</em>. Ηράκλειο: Πανεπιστημιακές Εκδόσεις Κρήτης.</p>
  <p>Tueller, Michael, ed. 1916&ndash;1918 (new edition, 2014&ndash;). <em>The Greek Anthology</em>. Translated by W. R. Paton. Bilingual edition. Vols. 1&ndash;5. Cambridge, Mass.: Harvard University Press.</p>
  <p>Wilson, N. G. 1997. <em>Aelian: Historical Miscellany</em>. Cambridge, Mass.: Harvard University Press.</p>
  <p>&nbsp;</p>
  <p style="font-size:85%; text-align: center;"><i>Many thanks to:
  <a href="https://classics.stanford.edu">Stanford's Department of Classics</a> for financial support,<br>
  <a href="http://www.awmc.unc.edu">Ancient World Mapping Center</a>,
  <a href="https://cartodb.com">CartoDB</a>,<br>
  <a href="http://ghusse.github.io/jQRangeSlider/">jQRangeSlider</a>,
  <a href="https://www.mapbox.com">Mapbox</a>,
  <a href="http://orbis.stanford.edu">Orbis</a>,
  <a href="http://pleiades.stoa.org">Pleiades</a>, and <br>
  <a href="http://hdlab.stanford.edu">Stanford's Humanities + Design Lab</a>.</i></p>
  <p>&nbsp;</p>
  <hr>
  <a href="#" id="homeLink">Return to Introduction</a></p>
  `);
}