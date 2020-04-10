import { Component, OnInit } from '@angular/core';
//import { script } from './script';
//import { util } from './util';
//import { ball } from './ball';

declare var ball:any;
declare var script:any;
declare var util:any;

@Component({
  selector: 'app-balls',
  templateUrl: './balls.component.html',
  styleUrls: ['./balls.component.css']
})
export class BallsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  	ball();
  	script();
  	util();
  	  }

  ballScript(){
  	new ball();
  }

  scriptCall(){
  	new script();
  }

  utilScript(){
  	new util();
  }



}
