function select(event) {
  var option = event.target.value;
  console.log(option);
  if (option == 1 || option == 2 || option == 3) {
    console.log("in");
    document.getElementById("quantum").setAttribute("style", "display:none");
    document.getElementById("priorities").setAttribute("style", "display:none");
  }
  else if(option == 4){
    document.getElementById("quantum").setAttribute("style", "display:block");
    document.getElementById("priorities").setAttribute("style", "display:none");
   
  }
  else if(option == 5 || option == 6){
    document.getElementById("quantum").setAttribute("style", "display:none");
    document.getElementById("priorities").setAttribute("style", "display:block");
   

  }
}
