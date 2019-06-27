queue()
    .defer(d3.json, 'static/data/characters.json')
    .await(makeGraphs);
    
function makeGraphs(error, charactersData) {
    var ndx = crossfilter(charactersData);
    
        charactersData.forEach(function(d){
        
        d.appearances = parseInt(d.appearances);
        d.first_appearance=parseInt(d.first-appearance);
      
    });
    
    /* var dateFormat = d3.time.format("%Y");
    charactersData.forEach(function (d) {
        d["year"] = dateFormat.parse(d["year"]+'');
    });
    */
    
    show_alignment(ndx);
    
    show_numberOfAppearance(ndx);
    
    
    gender_selector(ndx);
    display_gender_percent(ndx, 'male characters', '#percent-male');
    display_gender_percent(ndx, 'female characters', '#percent-female');
    display_gender_percent(ndx, 'genderless characters', '#percent-other');
    
    show_eyeColor(ndx);
    show_identity(ndx);
    
    //tabulate(charactersData, ['name', 'urlslug', 'first appearance']);
    listCharacters(ndx);
    
    dc.renderAll();
    
}

/*----------Helpers-----------*/
//To remove empty values from grouped data//

function remove_blanks(group, value_to_remove) {
    
    return {
        all: function() {
            return group.all().filter(function(d) {
                return d.key !== value_to_remove;
            });
        }
    };
}
/*------------Gender count and Percentage ---------*/

function gender_selector(ndx) {
    var genderDim = ndx.dimension(dc.pluck('sex'));
    var genderGroup = remove_blanks(genderDim.group(), "");

    dc.selectMenu('#genderPercent')
        .dimension(genderDim)
        .group(genderGroup);
}

function display_gender_percent(ndx, sex, element) {
    var genderPercent = ndx.groupAll().reduce(
        // Sum totals for each gender type
        function(p, v) {
            p.total++;
            if (v.sex === sex) {
                p.sex_count++;
            }
            return p;
        },
        function(p, v) {
            p.total--;
            if (v.sex === sex) {
                p.sex_count--;
            }
            return p;
        },
        function() {
            return { total: 0, sex_count: 0 };
        }
    );

    dc.numberDisplay(element)
        .formatNumber(d3.format('.2%'))
        .valueAccessor(function(d) {
            if (d.sex_count == 0) {
                return 0;
            }
            else {
                return (d.sex_count / d.total);
            }
        })
        .group(genderPercent);
}





/*--------------Align Barchart---------*/

function show_alignment(ndx) {
   

    function alignmentByGender(dimension, align) {
        return dimension.group().reduce(
            function (p, v) {
                p.total++;
                if (v.align === align) {
                    p.match++;
                };
                return p;
            },
            function (p, v) {
                p.total--;
                if (v.align === align) {
                    p.match--;
                };
                return p;
            },
            function () {
                return { total: 0, match: 0 }
            }
            
        );
        
    };

    var dim = ndx.dimension(dc.pluck("sex"));
  //  var genderGroup = remove_blanks(dim.group(), "");
    var goodByGender = alignmentByGender(dim, "good characters"); 
    var badByGender = alignmentByGender(dim, "bad characters");
    var neutralByGender = alignmentByGender(dim, "neutral characters");
  
    dc.barChart("#alignment")
        .width(350)
        .height(250)
        
        .dimension(dim)
        .group(goodByGender, "Good")
        .stack(badByGender, "Bad")
        .stack(neutralByGender, "Neutral")
        .valueAccessor(function (d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100
            } else {
                return 0;
            }
            return d.value.percent * 100;
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .legend(dc.legend().x(270).y(170).itemHeight(15).gap(5))
        .margins({top: 10, right: 100, bottom: 30, left: 30});
}


/*--------------------scatterplot-------*/

function show_numberOfAppearance(ndx) {
     
     var genderColors = d3.scale.ordinal()
        .domain(["female", "male"])
        .range(["pink", "blue"]);
        
      var yearDim = ndx.dimension(function (d) {
      return d.year;
    });  
        
     var xyearDim = ndx.dimension(function(d){
        return [d.year, d.appearances, d.sex];
    });
    var yearAppearanceGroup = xyearDim.group();
    
  
    
    var minYear = yearDim.bottom(1)[0]["year"];
    var maxYear = yearDim.top(1)[0]["year"];
    
    dc.scatterPlot("#apperarance")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minYear,maxYear]))
        .symbolSize(10)
        .clipPadding(15)
        .xAxisLabel("Year")
        .yAxisLabel("Apperarance")
        
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        
        .dimension(yearDim)
        .group(yearAppearanceGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});

}

 //var noOfAppearancesDim = ndx.dimension(function(d){
    //    return d.appearances;
   // })
  //   var minAppr = noOfAppearancesDim.bottom(1)[25].appearances;
  //   var maxAppr = noOfAppearancesDim.top(1)[250].appearances; 
     
 // var minYear = yearDim.bottom(0)[1935].year;
  //  var maxYear = yearDim.bottom(0)[2015].year;

 /*-----------------Pie Chart -----------------------*/

  function show_eyeColor(ndx) {
    var dim = ndx.dimension(dc.pluck("eye"));
    var group = remove_blanks(dim.group(), "");
    
    dc.pieChart("#eye-color")
      .height(300)
      .width(350)
      .radius(125)
      .transitionDuration(1000)
      .dimension(dim)
      .group(group)
      .legend(dc.legend().gap(7));
  }  
    
function show_identity(ndx) {
    var dim = ndx.dimension(dc.pluck("id"));
    var group = remove_blanks(dim.group(), "");
    

    dc.pieChart("#identity")
      .height(300)
      .width(350)
      .useViewBoxResizing(true)
      .radius(125)
      .transitionDuration(1000)
      .dimension(dim)
      .group(group)
      .legend(dc.legend().gap(7));
  }  
    

/*------------Table--------*/
/*
function tabulate(data, columns) {
        var table = d3.select('#list').append('table')
            .attr("style", "border: 1px solid wheat");
        var thead = table.append('thead');
        var tbody = table.append('tbody');

        // append the header row
        thead.append('tr')
            .selectAll('th')
            .data(columns).enter()
            .append('th')
            .text(function(column) { return column; });

        // create a row for each object in the data
        var rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr');

        // create a cell in each row for each column
        var cells = rows.selectAll('td')
            .data(function(row) {
                return columns.map(function(column) {
                    return { column: column, value: row[column] };
                });
            })
            .enter()
            .append('td')
            .html(function(d) {
                let regex = /^(http:\/\/)/; //This REGEX was not in the example table given below..
                if (regex.test(d.value)) {
                    return `<a href='${d.value}' target="_blank">Link to Wikia</a>`;
                }
                else {
                    return d.value;
                }

            });

        return table;
    }
 valueAccessor(function(d) {
      dataSize = d;
      offset= 0;
      chartUpdate();
      return d
     })
  */
  
  function listCharacters(ndx){
    var dim = ndx.dimension(dc.pluck("name"));
    
    
    
    dc.dataTable("#all-characters")
      .dimension(dim)
      .group(function(d) {
        return "";
      })
      .columns(["name", "urlslug", "first appearance"])
      
       function pagerInfo() {
      d3.select('#begin')
          .text(offset+1);
      if(offset+page-1 > dataSize){
        d3.select('#end')
          .text(dataSize);
      }
      else{
        d3.select('#end')
          .text(offset+page);
      }
      d3.select('#info-prev')
          .attr('disabled', offset-page<0 ? 'true' : null);
      d3.select('#info-next')
          .attr('disabled', offset+page>=dataSize ? 'true' : null);
      d3.select('#size').text(dataSize);
    }
    function chartUpdate() {
      all-characters.beginSlice(offset);
      all-characters.endSlice(offset+page);
      pagerInfo();
      all-characters.redraw();
    }
    function nextPage() {
        offset += page;
        chartUpdate();
    }
    function prevPage() {
        offset -= page;
        chartUpdate();
    }
    $('#info-next').click(nextPage)
    $('#info-prev').click(prevPage)

      
      
     .size(Infinity)
      .sortBy(dc.pluck("name"))
   
      .order(d3.ascending)
      .transitionDuration(1000);
      
  //   chartUpdate();
  //  dc.renderAll();
    
  //  fix.winResize(dc.renderAll);
  }

   


