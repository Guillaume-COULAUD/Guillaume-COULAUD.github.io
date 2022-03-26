if (!localStorage.getItem('listeClasse')) {
    localStorage.setItem('listeClasse', JSON.stringify([]));
}
if (!localStorage.getItem('listeControle')) {
    localStorage.setItem('listeControle', JSON.stringify([]));
}
var app = new Vue({
    el: '#app',
    data: {
        administration:false,
        creerControle:false,
        importClasse: false,
        startEval : false,
        classe : null,
        controle: null,
        listeClasse : JSON.parse(localStorage.getItem('listeClasse')),
        listeControle : JSON.parse(localStorage.getItem('listeControle')),
        classeSelected : -1,
        controleSelected : -1,
        eleveSelected : -1,
        notes : [],
        notes_eleves: [],
    },
    methods: {
        newCritere: function (eventTarget) {
            let nom_controle = eventTarget.target.parentNode.querySelector("input[name=nom_controle]").value;
            let criteres = eventTarget.target.parentNode.querySelectorAll("input[name=nom_critere]");
            let criteres_array = [];
            criteres.forEach(function (critere) {
                criteres_array.push(critere.value);
            });
            this.listeControle.push({nom: nom_controle, criteres: criteres_array});
            localStorage.setItem('listeControle', JSON.stringify(this.listeControle));
            this.creerControle = false;
        },
        addCritere: function (eventTarget) {
            let template = document.getElementById("template_nouveau_critere");
            let clone = document.importNode(template.content, true);
            eventTarget.target.parentNode.insertBefore(clone, eventTarget.target);
        },
        saveClasse: function(eventTarget) {
            let classe = {};
            let nom_classe = eventTarget.target.parentNode.querySelector("input[name=nom_classe]").value;
            let file = eventTarget.target.parentNode.querySelector("input[name=file_classe]");
            if (nom_classe && file.value) {
                app.listeClasse.push({nom: nom_classe, eleves: []});
                let index = app.listeClasse.findIndex(object => {
                    return object.nom === nom_classe;
                });
                var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
                if (regex.test(file.value.toLowerCase())) {
                    if (typeof (FileReader) != "undefined") {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var table = document.createElement("table");
                            var rows = e.target.result.split("\r\n");
                            for(let i = 0; i < rows.length - 1; i++) {
                                let row_explode = rows[i].split(",");
                                let nom_eleve = row_explode[0];
                                let prenom_eleve = row_explode[1];
                                app.listeClasse[index].eleves.push({nom: nom_eleve, prenom: prenom_eleve, controles: []});
                            }
                            let aled = JSON.stringify(app.listeClasse);
                            localStorage.setItem('listeClasse', aled);
                            app.importClasse = false;
                        }
                        reader.readAsText(file.files[0]);
                    } else {
                        alert("This browser does not support HTML5.");
                    }
                } else {
                    alert("Please upload a valid CSV file.");
                }
            }
            else {
                alert("Veuillez indiquer un nom à la classe et importer le fichier ayant la classe !");
            }
        },
        startEvaluation: function () {
            let criteres = app.listeControle[app.controleSelected].criteres;
            let eleves = app.listeClasse[app.classeSelected].eleves;
            let notes = [];
            let notes_eleves = [];
            app.listeClasse[app.classeSelected].eleves.forEach(function (eleve, index) {
                let controle_eleve = app.listeClasse[app.classeSelected].eleves[index].controles[app.controleSelected];
                let criteres_controles = [];
                if (controle_eleve === undefined) {
                    criteres.forEach(function(critere) {
                        criteres_controles.push({nom: critere, note: null});
                    });
                    app.listeClasse[app.classeSelected].eleves[index].controles[app.controleSelected] = {};
                    app.listeClasse[app.classeSelected].eleves[index].controles[app.controleSelected] = {nom: app.listeControle[app.controleSelected].nom,
                        criteres: criteres_controles};
                }
            });
            criteres.forEach(function(critere) {
                notes[critere] = {};
                notes[critere].notes = [];
                notes[critere].min = null;
                notes[critere].max = null;
                notes[critere].avg = null;
                notes_eleves[critere] = null;
                eleves.forEach(function (eleve, index) {
                    let controles = eleve.controles.find(controle => controle.nom == app.listeControle[app.controleSelected].nom);
                    let note_critere = controles.criteres.find(element => element.nom == critere).note;
                    if (note_critere != null) {
                        notes[critere].notes[index] = (note_critere);
                        if (notes[critere].min == null || notes[critere].min > note_critere) {
                            notes[critere].min = note_critere;
                        }
                        if (!notes[critere].max == null || notes[critere].max < note_critere) {
                            notes[critere].max = note_critere;
                        }
                    }
                });
                if (notes[critere].notes.length > 0) {

                    let avg = 0;
                    let length = 0;
                    notes[critere].notes.forEach(function (note) {
                        length++;
                        avg += parseInt(note);
                    });
                    avg = avg / length;
                    notes[critere].avg = avg;
                }
            });
            app.notes = Object.assign({}, app.notes, notes);
            app.startEval = true;
        },
        changeNote: function (critere, event) {
            let value = event.target.value;
            let controle_eleve = app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected];
            let index_critere = controle_eleve.criteres.findIndex(element => element.nom == critere);
            if (index_critere != -1) {
                app.notes[critere].notes[app.eleveSelected] = parseInt(value);
                app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected].criteres[index_critere].note = parseInt(value);
            }
            else {
                app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected].criteres.push({nom: critere, note: parseInt(value)});
                app.notes[critere].notes[app.eleveSelected] = parseInt(value);
            }
            let avg = 0;
            let length = 0;
            let min = null;
            let max = null;
            app.notes[critere].notes.forEach(function (note) {
                if (min == null || min > parseInt(note)) {
                    min = parseInt(note);
                }
                if (max == null || max < parseInt(note)) {
                    max = parseInt(note);
                }
                length++;
                avg += parseInt(note);
            });
            avg = avg / length;
            app.notes[critere].avg = avg;

            app.notes[critere].min = min;
            app.notes[critere].max = max;
            let criteres = app.listeControle[app.controleSelected].criteres;
            let controle_fini = true;
            criteres.forEach(function(critere) {
                if (app.notes_eleves[critere] == null) {
                    controle_fini = false;
                }
            });
            if (controle_fini) {
                app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected].fini = true;
            }
            localStorage.setItem('listeClasse', JSON.stringify(app.listeClasse));
        },
        changeEleve: function () {
            let criteres = app.listeControle[app.controleSelected].criteres;
            let notes_eleves = [];
            criteres.forEach(function(critere) {
                let index_critere = app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected].criteres.findIndex(element => element.nom == critere);
                notes_eleves[critere] = app.listeClasse[app.classeSelected].eleves[app.eleveSelected].controles[app.controleSelected].criteres[index_critere].note;
            });
            app.notes_eleves = Object.assign([], app.notes_eleves, notes_eleves);
        },
        nextEleve: function () {
            if (app.eleveSelected == app.listeClasse[app.classeSelected].eleves.length-1) {
                app.eleveSelected = 0;
            }
            else {
                app.eleveSelected += 1;
            }
            app.changeEleve();
        },
        previousEleve: function () {
            if (app.eleveSelected == 0) {
                app.eleveSelected = app.listeClasse[app.classeSelected].eleves.length-1;
            }
            else {
                app.eleveSelected -= 1;
            }
            app.changeEleve();
        }
    }
});

