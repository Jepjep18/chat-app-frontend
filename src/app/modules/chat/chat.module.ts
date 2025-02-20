import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

const chatRoutes: Route[] = [
  {
    path: '',
    component: ChatComponent
  }
]


@NgModule({
  declarations: [
    ChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(chatRoutes)
  ]
})
export class ChatModule { }
