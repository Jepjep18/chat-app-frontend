import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InterestSectionComponent } from './interest-section/interest-section.component';

const chatRoutes: Route[] = [
  {
    path: 'chat',
    component: ChatComponent
  },
  {
    path: '',
    component: InterestSectionComponent
  }
]


@NgModule({
  declarations: [
    ChatComponent,
    InterestSectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(chatRoutes)
  ]
})
export class ChatModule { }
