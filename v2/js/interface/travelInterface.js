export function createTravelInterfaceHtml() {
  return (`
  <div class="buttonContainer" style="background: rgba(255,255,255,0);">            
  <fieldset style="border: none;" id="controlForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >MOBILITY</div>
    <input type="radio" value="all_1" name="city" id="all_1" checked>
    <label for="all_1" class="picker-label">ALL CASES</label>		
  </fieldset>
</div>
  
<div class="buttonContainer" style="background: rgba(255,255,255,0); height: 100px;">            
  <fieldset style="border: none;" id="cityForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >POET: </div>

<input type="radio" value="0" name="city" id="poet_92">
<label for="poet_92" class="picker-label">Alcaeus</label>

<input type="radio" value="0" name="city" id="poet_93">
<label for="poet_93" class="picker-label">Alcman</label>

<input type="radio" value="0" name="city" id="poet_94">
<label for="poet_94" class="picker-label">Anacreon</label>

<input type="radio" value="0" name="city" id="poet_97">
<label for="poet_97" class="picker-label">Archilochus</label>

<input type="radio" value="0" name="city" id="poet_98">
<label for="poet_98" class="picker-label">Arion</label>

<input type="radio" value="0" name="city" id="poet_23">
<label for="poet_23" class="picker-label">Ariphron</label>

<input type="radio" value="0" name="city" id="poet_100">
<label for="poet_100" class="picker-label">Bacchylides</label>

<input type="radio" value="0" name="city" id="poet_11">
<label for="poet_11" class="picker-label">Bakkhiadas</label>

<input type="radio" value="0" name="city" id="poet_101">
<label for="poet_101" class="picker-label">Callinus</label>

<input type="radio" value="0" name="city" id="poet_104">
<label for="poet_104" class="picker-label">Corinna</label>

<input type="radio" value="0" name="city" id="poet_107">
<label for="poet_107" class="picker-label">Demodocus</label>

<input type="radio" value="0" name="city" id="poet_59">
<label for="poet_59" class="picker-label">Diagoras</label>

<input type="radio" value="0" name="city" id="poet_109">
<label for="poet_109" class="picker-label">Dionysius Chalkus</label>

<input type="radio" value="0" name="city" id="poet_111">
<label for="poet_111" class="picker-label">Echembrotus</label>

<input type="radio" value="0" name="city" id="poet_43">
<label for="poet_43" class="picker-label">Euangelos</label>

<input type="radio" value="0" name="city" id="poet_65">
<label for="poet_65" class="picker-label">Euenos</label>

<input type="radio" value="0" name="city" id="poet_112">
<label for="poet_112" class="picker-label">Eumelos of Corinth</label>

<input type="radio" value="0" name="city" id="poet_44">
<label for="poet_44" class="picker-label">Eumelos of Elis</label>

<input type="radio" value="0" name="city" id="poet_114">
<label for="poet_114" class="picker-label">Euripides</label>

<input type="radio" value="0" name="city" id="poet_115">
<label for="poet_115" class="picker-label">Hermippus</label>

<input type="radio" value="0" name="city" id="poet_71">
<label for="poet_71" class="picker-label">Hippias</label>

<input type="radio" value="0" name="city" id="poet_116">
<label for="poet_116" class="picker-label">Hipponax</label>

<input type="radio" value="0" name="city" id="poet_117">
<label for="poet_117" class="picker-label">Ibycus</label>

<input type="radio" value="0" name="city" id="poet_55">
<label for="poet_55" class="picker-label">Ion of Chios</label>

<input type="radio" value="0" name="city" id="poet_72">
<label for="poet_72" class="picker-label">Ion of Samos</label>

<input type="radio" value="0" name="city" id="poet_51">
<label for="poet_51" class="picker-label">Khairis</label>

<input type="radio" value="0" name="city" id="poet_20">
<label for="poet_20" class="picker-label">Krateuas</label>

<input type="radio" value="0" name="city" id="poet_120">
<label for="poet_120" class="picker-label">Lamprus</label>

<input type="radio" value="0" name="city" id="poet_121">
<label for="poet_121" class="picker-label">Lasus</label>

<input type="radio" value="0" name="city" id="poet_3">
<label for="poet_3" class="picker-label">Licymnius</label>

<input type="radio" value="0" name="city" id="poet_52">
<label for="poet_52" class="picker-label">Magnes</label>

<input type="radio" value="0" name="city" id="poet_153">
<label for="poet_153" class="picker-label">Melampus</label>

<input type="radio" value="0" name="city" id="poet_158">
<label for="poet_158" class="picker-label">Melanippides</label>

<input type="radio" value="0" name="city" id="poet_49">
<label for="poet_49" class="picker-label">Moskhos</label>

<input type="radio" value="0" name="city" id="poet_126">
<label for="poet_126" class="picker-label">Philiadas</label>

<input type="radio" value="0" name="city" id="poet_24">
<label for="poet_24" class="picker-label">Philoxenus of Cythera</label>

<input type="radio" value="0" name="city" id="poet_5">
<label for="poet_5" class="picker-label">Phrynis</label>

<input type="radio" value="0" name="city" id="poet_149">
<label for="poet_149" class="picker-label">Pindar</label>

<input type="radio" value="0" name="city" id="poet_26">
<label for="poet_26" class="picker-label">Polyidus</label>

<input type="radio" value="0" name="city" id="poet_128">
<label for="poet_128" class="picker-label">Polymnestus</label>

<input type="radio" value="0" name="city" id="poet_129">
<label for="poet_129" class="picker-label">Pratinas</label>

<input type="radio" value="0" name="city" id="poet_2">
<label for="poet_2" class="picker-label">Pronomus</label>

<input type="radio" value="0" name="city" id="poet_131">
<label for="poet_131" class="picker-label">Sacadas</label>

<input type="radio" value="0" name="city" id="poet_132">
<label for="poet_132" class="picker-label">Sappho</label>

<input type="radio" value="0" name="city" id="poet_134">
<label for="poet_134" class="picker-label">Semonides</label>

<input type="radio" value="0" name="city" id="poet_135">
<label for="poet_135" class="picker-label">Simonides</label>

<input type="radio" value="0" name="city" id="poet_136">
<label for="poet_136" class="picker-label">Solon</label>

<input type="radio" value="0" name="city" id="poet_137">
<label for="poet_137" class="picker-label">Sophocles</label>

<input type="radio" value="0" name="city" id="poet_138">
<label for="poet_138" class="picker-label">Stesichorus</label>

<input type="radio" value="0" name="city" id="poet_139">
<label for="poet_139" class="picker-label">Susarion</label>

<input type="radio" value="0" name="city" id="poet_7">
<label for="poet_7" class="picker-label">Telestes</label>

<input type="radio" value="0" name="city" id="poet_141">
<label for="poet_141" class="picker-label">Terpander</label>

<input type="radio" value="0" name="city" id="poet_142">
<label for="poet_142" class="picker-label">Thaletas</label>

<input type="radio" value="0" name="city" id="poet_45">
<label for="poet_45" class="picker-label">Thespis of Thebes</label>

<input type="radio" value="0" name="city" id="poet_144">
<label for="poet_144" class="picker-label">Timocreon</label>

<input type="radio" value="0" name="city" id="poet_6">
<label for="poet_6" class="picker-label">Timotheus</label>

<input type="radio" value="0" name="city" id="poet_145">
<label for="poet_145" class="picker-label">Tyrtaeus</label>

<input type="radio" value="0" name="city" id="poet_155">
<label for="poet_155" class="picker-label">Xenocritus</label>

<input type="radio" value="0" name="city" id="poet_154">
<label for="poet_154" class="picker-label">Xenodamus</label>

<input type="radio" value="0" name="city" id="poet_148">
<label for="poet_148" class="picker-label">Xenophanes</label>

<input type="radio" value="0" name="city" id="poet_18">
<label for="poet_18" class="picker-label">-es</label>
  </fieldset>
</div>

<div class="buttonContainer" style="background: rgba(255,255,255,0); height: 100px;">            
  <fieldset style="border: none;" id="controlForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >PLACES (<span style="color: #fc1804;">to</span>/<span style="color: #551A8B;">from</span>): </div>
<input type="radio" value="0" name="city" id="destination_65">
<label for="destination_65" class="picker-label">Abdera</label>

<input type="radio" value="0" name="city" id="destination_95">
<label for="destination_95" class="picker-label">Acharnae</label>

<input type="radio" value="0" name="city" id="destination_89">
<label for="destination_89" class="picker-label">Aigina</label>

<input type="radio" value="0" name="city" id="destination_79">
<label for="destination_79" class="picker-label">Akragas</label>

<input type="radio" value="0" name="city" id="destination_77">
<label for="destination_77" class="picker-label">Amorgos</label>

<input type="radio" value="0" name="city" id="destination_59">
<label for="destination_59" class="picker-label">Antissa</label>

<input type="radio" value="0" name="city" id="destination_54">
<label for="destination_54" class="picker-label">Arcadia</label>

<input type="radio" value="0" name="city" id="destination_38">
<label for="destination_38" class="picker-label">Argos</label>

<input type="radio" value="0" name="city" id="destination_248">
<label for="destination_248" class="picker-label">Arne</label>

<input type="radio" value="0" name="city" id="destination_2">
<label for="destination_2" class="picker-label">Athens</label>

<input type="radio" value="0" name="city" id="destination_250">
<label for="destination_250" class="picker-label">Cephallenia</label>

<input type="radio" value="0" name="city" id="destination_4">
<label for="destination_4" class="picker-label">Chalcis</label>

<input type="radio" value="0" name="city" id="destination_6">
<label for="destination_6" class="picker-label">Chios</label>

<input type="radio" value="0" name="city" id="destination_75">
<label for="destination_75" class="picker-label">Clazomenae</label>

<input type="radio" value="0" name="city" id="destination_20">
<label for="destination_20" class="picker-label">Colophon</label>

<input type="radio" value="0" name="city" id="destination_48">
<label for="destination_48" class="picker-label">Corinth</label>

<input type="radio" value="0" name="city" id="destination_247">
<label for="destination_247" class="picker-label">Cyme</label>

<input type="radio" value="0" name="city" id="destination_35">
<label for="destination_35" class="picker-label">Cythera</label>

<input type="radio" value="0" name="city" id="destination_5">
<label for="destination_5" class="picker-label">Delos</label>

<input type="radio" value="0" name="city" id="destination_30">
<label for="destination_30" class="picker-label">Delphi</label>

<input type="radio" value="0" name="city" id="destination_91">
<label for="destination_91" class="picker-label">Egypt
</label>

<input type="radio" value="0" name="city" id="destination_32">
<label for="destination_32" class="picker-label">Elis</label>

<input type="radio" value="0" name="city" id="destination_11">
<label for="destination_11" class="picker-label">Ephesus</label>

<input type="radio" value="0" name="city" id="destination_50">
<label for="destination_50" class="picker-label">Erythrae</label>

<input type="radio" value="0" name="city" id="destination_78">
<label for="destination_78" class="picker-label">Gela</label>

<input type="radio" value="0" name="city" id="destination_60">
<label for="destination_60" class="picker-label">Gortyn</label>

<input type="radio" value="0" name="city" id="destination_16">
<label for="destination_16" class="picker-label">Helicon</label>

<input type="radio" value="0" name="city" id="destination_74">
<label for="destination_74" class="picker-label">Heracleia Trachinia</label>

<input type="radio" value="0" name="city" id="destination_31">
<label for="destination_31" class="picker-label">Hermione</label>

<input type="radio" value="0" name="city" id="destination_23">
<label for="destination_23" class="picker-label">Himera</label>

<input type="radio" value="0" name="city" id="destination_73">
<label for="destination_73" class="picker-label">Ikaros</label>

<input type="radio" value="0" name="city" id="destination_46">
<label for="destination_46" class="picker-label">Ioulis (Ceos)</label>

<input type="radio" value="0" name="city" id="destination_146">
<label for="destination_146" class="picker-label">Isthmus</label>

<input type="radio" value="0" name="city" id="destination_64">
<label for="destination_64" class="picker-label">Katane</label>

<input type="radio" value="0" name="city" id="destination_81">
<label for="destination_81" class="picker-label">Krannon</label>

<input type="radio" value="0" name="city" id="destination_149">
<label for="destination_149" class="picker-label">Larisa</label>

<input type="radio" value="0" name="city" id="destination_47">
<label for="destination_47" class="picker-label">Leros</label>

<input type="radio" value="0" name="city" id="destination_21">
<label for="destination_21" class="picker-label">Leucas</label>

<input type="radio" value="0" name="city" id="destination_14">
<label for="destination_14" class="picker-label">Locri</label>

<input type="radio" value="0" name="city" id="destination_84">
<label for="destination_84" class="picker-label">Locris Ozolia</label>

<input type="radio" value="0" name="city" id="destination_33">
<label for="destination_33" class="picker-label">Macedonia</label>

<input type="radio" value="0" name="city" id="destination_44">
<label for="destination_44" class="picker-label">Magnesia-ad-Sipylum</label>

<input type="radio" value="0" name="city" id="destination_70">
<label for="destination_70" class="picker-label">Mantineia</label>

<input type="radio" value="0" name="city" id="destination_58">
<label for="destination_58" class="picker-label">Matauria</label>

<input type="radio" value="0" name="city" id="destination_17">
<label for="destination_17" class="picker-label">Megara</label>

<input type="radio" value="0" name="city" id="destination_1">
<label for="destination_1" class="picker-label">Melos</label>

<input type="radio" value="0" name="city" id="destination_49">
<label for="destination_49" class="picker-label">Messena</label>

<input type="radio" value="0" name="city" id="destination_251">
<label for="destination_251" class="picker-label">Messenia</label>

<input type="radio" value="0" name="city" id="destination_88">
<label for="destination_88" class="picker-label">Metapontion</label>

<input type="radio" value="0" name="city" id="destination_45">
<label for="destination_45" class="picker-label">Methymna</label>

<input type="radio" value="0" name="city" id="destination_9">
<label for="destination_9" class="picker-label">Miletus</label>

<input type="radio" value="0" name="city" id="destination_219">
<label for="destination_219" class="picker-label">Mt. Ptoios</label>

<input type="radio" value="0" name="city" id="destination_8">
<label for="destination_8" class="picker-label">Mytilene</label>

<input type="radio" value="0" name="city" id="destination_66">
<label for="destination_66" class="picker-label">Naxos</label>

<input type="radio" value="0" name="city" id="destination_27">
<label for="destination_27" class="picker-label">Nemea</label>

<input type="radio" value="0" name="city" id="destination_87">
<label for="destination_87" class="picker-label">Olympia</label>

<input type="radio" value="0" name="city" id="destination_83">
<label for="destination_83" class="picker-label">Pallantion</label>

<input type="radio" value="0" name="city" id="destination_39">
<label for="destination_39" class="picker-label">Paros</label>

<input type="radio" value="0" name="city" id="destination_71">
<label for="destination_71" class="picker-label">Pellene</label>

<input type="radio" value="0" name="city" id="destination_105">
<label for="destination_105" class="picker-label">Peloponnese</label>

<input type="radio" value="0" name="city" id="destination_85">
<label for="destination_85" class="picker-label">Persia</label>

<input type="radio" value="0" name="city" id="destination_80">
<label for="destination_80" class="picker-label">Pharsalos</label>

<input type="radio" value="0" name="city" id="destination_55">
<label for="destination_55" class="picker-label">Phleious</label>

<input type="radio" value="0" name="city" id="destination_90">
<label for="destination_90" class="picker-label">Pyrrha</label>

<input type="radio" value="0" name="city" id="destination_15">
<label for="destination_15" class="picker-label">Rhegium</label>

<input type="radio" value="0" name="city" id="destination_61">
<label for="destination_61" class="picker-label">Rhodes</label>

<input type="radio" value="0" name="city" id="destination_82">
<label for="destination_82" class="picker-label">Salamis</label>

<input type="radio" value="0" name="city" id="destination_41">
<label for="destination_41" class="picker-label">Samos</label>

<input type="radio" value="0" name="city" id="destination_94">
<label for="destination_94" class="picker-label">Sanctuary of Poseidon Petraios</label>

<input type="radio" value="0" name="city" id="destination_43">
<label for="destination_43" class="picker-label">Sardis</label>

<input type="radio" value="0" name="city" id="destination_12">
<label for="destination_12" class="picker-label">Selinus</label>

<input type="radio" value="0" name="city" id="destination_22">
<label for="destination_22" class="picker-label">Selymbria</label>

<input type="radio" value="0" name="city" id="destination_68">
<label for="destination_68" class="picker-label">Sicily</label>

<input type="radio" value="0" name="city" id="destination_13">
<label for="destination_13" class="picker-label">Sicyon</label>

<input type="radio" value="0" name="city" id="destination_36">
<label for="destination_36" class="picker-label">Smyrna</label>

<input type="radio" value="0" name="city" id="destination_63">
<label for="destination_63" class="picker-label">Soli (Cyprus)</label>

<input type="radio" value="0" name="city" id="destination_26">
<label for="destination_26" class="picker-label">Soli (Soloi/Pompeiopolis)</label>

<input type="radio" value="0" name="city" id="destination_10">
<label for="destination_10" class="picker-label">Sparta</label>

<input type="radio" value="0" name="city" id="destination_18">
<label for="destination_18" class="picker-label">Syracuse</label>

<input type="radio" value="0" name="city" id="destination_69">
<label for="destination_69" class="picker-label">Tainaron</label>

<input type="radio" value="0" name="city" id="destination_57">
<label for="destination_57" class="picker-label">Tanagra</label>

<input type="radio" value="0" name="city" id="destination_19">
<label for="destination_19" class="picker-label">Tarentum</label>

<input type="radio" value="0" name="city" id="destination_42">
<label for="destination_42" class="picker-label">Teos</label>

<input type="radio" value="0" name="city" id="destination_40">
<label for="destination_40" class="picker-label">Thasos</label>

<input type="radio" value="0" name="city" id="destination_3">
<label for="destination_3" class="picker-label">Thebes</label>

<input type="radio" value="0" name="city" id="destination_76">
<label for="destination_76" class="picker-label">Thespiai</label>

<input type="radio" value="0" name="city" id="destination_72">
<label for="destination_72" class="picker-label">Thurii</label>

<input type="radio" value="0" name="city" id="destination_249">
<label for="destination_249" class="picker-label">Tripodiskos</label>
  </fieldset>
</div>

<div class="buttonContainer" style="background: rgba(255,255,255,0);">            
  <fieldset style="border: none;" id="controlForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >GEOGRAPHICAL REGION (<span style="color: #fc1804;">to</span>/<span style="color: #551A8B;">from</span>): </div>

    <input type="radio" value="0" name="city" id="region_1">
    <label for="region_1" class="picker-label">Magna Graecia</label>

<input type="radio" value="0" name="city" id="region_2">
    <label for="region_2" class="picker-label">Mainland Greece</label>

    <input type="radio" value="0" name="city" id="region_3">
    <label for="region_3" class="picker-label">Aegean Islands</label>

    <input type="radio" value="0" name="city" id="region_4">
    <label for="region_4" class="picker-label">Asia Minor</label>		

  </fieldset>
</div>

<div class="buttonContainer" style="background: rgba(255,255,255,0); height: 100px;">            
  <fieldset style="border: none;" id="controlForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >SMALL GEOGRAPHICAL REGION (<span style="color: #fc1804;">to</span>/<span style="color: #551A8B;">from</span>): </div>

<input type="radio" value="0" name="city" id="small_region_2">
    <label for="small_region_2" class="picker-label">Attica</label>

    <input type="radio" value="0" name="city" id="small_region_3">
    <label for="small_region_3" class="picker-label">Boeotia</label>

    <input type="radio" value="0" name="city" id="small_region_4">
    <label for="small_region_4" class="picker-label">Central Greece</label>

    <input type="radio" value="0" name="city" id="small_region_17">
    <label for="small_region_17" class="picker-label">Crete</label>

    <input type="radio" value="0" name="city" id="small_region_1">
    <label for="small_region_1" class="picker-label">Cyclades & western Aegean Islands</label>

    <input type="radio" value="0" name="city" id="small_region_18">
    <label for="small_region_18" class="picker-label">Cyprus</label>	

<input type="radio" value="0" name="city" id="small_region_15">
    <label for="small_region_15" class="picker-label">Dodecanese</label>

    <input type="radio" value="0" name="city" id="small_region_22">
    <label for="small_region_22" class="picker-label">Euboea</label>

    <input type="radio" value="0" name="city" id="small_region_19">
    <label for="small_region_19" class="picker-label">Ionian Sea</label>

    <input type="radio" value="0" name="city" id="small_region_8">
    <label for="small_region_8" class="picker-label">Lesbos</label>

    <input type="radio" value="0" name="city" id="small_region_14">
    <label for="small_region_14" class="picker-label">Lydia</label>

<input type="radio" value="0" name="city" id="small_region_11">
    <label for="small_region_11" class="picker-label">Northern Greece</label>

    <input type="radio" value="0" name="city" id="small_region_9">
    <label for="small_region_9" class="picker-label">Peloponnese</label>

<input type="radio" value="0" name="city" id="small_region_7">
    <label for="small_region_7" class="picker-label">Sicily</label>

    <input type="radio" value="0" name="city" id="small_region_12">
    <label for="small_region_12" class="picker-label">Thessaly</label>

  </fieldset>
</div>

<div class="buttonContainer" style="background: rgba(255,255,255,0);">            
  <fieldset style="border: none;" id="controlForm" class="controlForm">
    <div style="color:black;padding-right:5px;display: inline-block;margin-top: 3px; font-weight: bold;" >POLITICAL SYSTEM (<span style="color: #fc1804;">to</span>/<span style="color: #551A8B;">from</span>/<span style="color: #ffbf00;">within</span>): </div>

    <input type="radio" value="0" name="city" id="gov_3">
    <label for="gov_3" class="picker-label">Democracy</label>

<input type="radio" value="0" name="city" id="gov_4">
    <label for="gov_4" class="picker-label">Kingship</label>

    <input type="radio" value="0" name="city" id="gov_7">
    <label for="gov_7" class="picker-label">Mixed</label>

    <input type="radio" value="0" name="city" id="gov_1">
    <label for="gov_1" class="picker-label">Oligarchy</label>

    <input type="radio" value="0" name="city" id="gov_2">
    <label for="gov_2" class="picker-label">Tyranny</label>

    <label class="picker-label" style="cursor: auto">[Mapping in Progress]</label>		

  </fieldset>
</div></div>
  `);
}