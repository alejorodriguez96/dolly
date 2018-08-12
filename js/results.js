Results = {};

// Load data JSON
getJSON("analitics/valoraciones_docentes.json", function(data,st){
  // Prepare keys
  Results.materias = get_indexes('mat',data);
  Results.docentes = get_indexes('doc',data);
  Results.data = data;
  console.log("data loaded");
  // Load comments
  getJSON("analitics/comentarios_docentes.json", function(data,st){
    // Decode
    d=data;
    Results.comentarios = data.map(function(x){
      x.comentarios = x.comentarios.filter(x=>x).map(b64_to_utf8);
      return x;
    });
    console.log("comments loaded");

    Table.init();
    Table.filterMateria($(document).getUrlParam("mat"));
  }).fail(function(err){
    console.log("error loading comments");
    $("#load-fail").slideDown(1000);
  });
}).fail(function(err){
  console.log("error loading data");
  $("#load-fail").slideDown(1000);
});

function get_indexes(index_name, data){
  let conj = {};
  data.forEach(function(x){
    conj[x[index_name]] = true;
  });
  return Object.keys(conj);
}

Calc = {
  detalle(data){
    const res = Object.keys(Calc.pesos).map(k => data[k]);
    colors = res.map(x => Calc.colors[Math.floor(Math.abs(x-0.001))]);

    const number_html = "<span class='m-0 p-1' style='background-color: COLOR' data-toggle='tooltip' data-placement='bottom' title='TOOLTIP'>NUMBER</span>";
    let html="";
    res.forEach(function(n,i){
      html += number_html.replace("COLOR", colors[i]).replace("NUMBER", Calc.roundScoreFix(n)).replace("TOOLTIP", Calc.tooltips[i]);
    });
    return html;
  },
  tooltips: [ // Link to questions.js
    "Asistencia a clase",
    "Cumple los horarios",
    "Sus clases están bien organizadas",
    "Explica con claridad",
    "Mantiene un trato adecuado",
    "Acepta la crítica fundamentada",
    "Fomenta la participación",
    "Responde por mail o Campus",
    "Presenta un panorama amplio"
  ],
  score(data){
    let tot = 0;
    Object.keys(Calc.pesos).forEach(function(k){
      tot += data[k]*Calc.pesos[k];
    });
    return tot/Calc.sum(Calc.pesos);
  },
  colors:[
    '#ff0000', //:(
    '#ff8000',
    '#ffff33', //:|
    '#b2ff66',
    '#33ff33'  //:D
  ],
  pesos: {
    'asistencia': 1,
    'cumple_horarios': 1,
    'clase_organizada': .7,
    'claridad': .7,
    'buen_trato': 0.5,
    'acepta_critica': 0.5,
    'fomenta_participacion': 0.5,
    'responde_mails': 0.5,
    'panorama_amplio': 0.5
  },

  roundScore: function(x){
    return Math.round(10*x)/10;
  },
  roundScoreFix: function(x){
    let str = "" + (Math.round(10*x)/10);
    str += (str.length==1)?".0":"";
    return str;
  },
  sum: function(arr){
    return Object.values(arr).reduce((a,b)=>a+b)
  },
  mean: function(arr){
    return Object.values(arr).reduce((a,b)=>a+b)/Object.values(arr).length;
  },
}

Table = {
  lastrow:0,
  init: function(){
    Table.clearTable();
  },
  filterMateria(mat){
    const rows = Results.data.filter(row => (row.mat == mat));
    const comments = Results.comentarios.filter(x => (x.mat == mat));
    Table.loadTable(rows, comments);
  },
  loadTable(rows, comments){
    // Calculate Score
    rows.map(function(row){
      row.score = Calc.score(row);
      return row;
    });

    // Sort table by score
    const sorted_rows = rows.sort((a,b) => (b.score-a.score));

    // Populate table
    sorted_rows.forEach(function(row){
      const comm = comments.filter(x => x.doc==row.doc);
      const comms = comm && comm[0].comentarios;

      const txt_resp = ""+row.respuestas+" <i class='fas fa-users'></i>" + (comms?"<span class='ml-3'>"+comms.length+" <i class='fas fa-comment-dots'></i></span>":"");
      const class_colors = (row.respuestas<5)?((row.respuestas<2)?"bg-danger":"bg-warning"):"bg-success";
      Table.addRow([
        {text: Calc.roundScore(row.score), class:""},
        {text: txt_resp, class: class_colors},
        {text: row.doc, class:""},
        {text: Calc.detalle(row), class:""}
      ],comms);
    });


    $('[data-toggle="tooltip"]').tooltip();
  },
  clearTable(){
    $("#tbody").empty();
    Table.lastrow = 0;
  },
  addRow(row, comments){
    // row = [{text:"", class:""}...{}]
    // comments = []
    const id = Table.lastrow++;

    // Create comments html
    let comments_items = "";
    comments && comments.forEach(function(comment){
      comments_items += Table.comment_html.replace("COMMENT", comment);
    });

    // Create row html
    let row_html = "";
    row.forEach(function(elem){
      row_html += Table.row_html.replace("TEXT", elem.text || "").replace("CLASS", elem.class || "");
    });

    const raw_html = Table.html_item + (comments? Table.comment_div : "");
    const html = raw_html.replace(/ID/g, id).replace("DATA_ROW",row_html).replace("COMMENT_LIST", comments_items || "");

    $("#tbody").append(html);
  },
  html_item: '<tr data-toggle="collapse" data-target="#demoID" class="accordion-toggle">\
    DATA_ROW\
  </tr>',
  comment_div:'<tr>\
      <td colspan="6" class="hiddenRow">\
          <div id="demoID" class="accordian-body collapse ml-3">\
          COMMENT_LIST\
          </div>\
      </td>\
  </tr>',
  row_html: '<td class="CLASS">TEXT</td>',
  comment_html: '<div class="col-12 zebra">COMMENT</div>'
}

// Selectpicker
getJSON("data/comun.json", function(data,st){
  console.log("cursos loaded!");
  let html="";
  data.materias.forEach(function(x,i){
    html += '<option class="option" value="' + x.codigo + '">' + x.codigo + " " + x.nombre + '</option>'
  });
  $("#materia").empty().append(html).selectpicker('val','').removeAttr("disabled").selectpicker('refresh'); //important!

  $("#materia").val($(document).getUrlParam("mat")).selectpicker('refresh');

  $("#materia").on('changed.bs.select',function(e){
    const url = $(location).attr('href').split("?")[0] + "?mat="+$("#materia").val();
    $(location).attr('href', url);
  })
}).fail(function(e){
  console.log("Error loading cursos");
  $("#load-fail").slideDown(1000);
});
