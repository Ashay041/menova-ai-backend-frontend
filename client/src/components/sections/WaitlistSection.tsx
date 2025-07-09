import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ClipboardCheck, Calendar } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";

// Form schema with validation
const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.string().optional(),
  menopauseStage: z.string().optional(),
  referralSource: z.string().optional(),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "You must agree to the Privacy Policy",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function WaitlistSection() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form setup with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      age: "",
      menopauseStage: "",
      referralSource: "",
      privacyPolicy: false, // Boolean refine validation is used instead of literal
    },
  });

  // Mutation for form submission
  const waitlistMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Extract the privacyPolicy field as it's not needed in the API call
      const { privacyPolicy, ...apiData } = values;
      return apiRequest("POST", "/api/waitlist", apiData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You've been added to our waitlist. We'll notify you when your access is ready.",
        variant: "default",
      });
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to join the waitlist. Please try again.";
      
      if (error.message.includes("409")) {
        errorMessage = "This email is already registered on our waitlist.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: FormValues) {
    waitlistMutation.mutate(values);
  }

  const benefits = [
    "Personalized menopause assessment results",
    "Early access to our AI health assistant",
    "Priority support from our clinical team",
    "Free access to premium features for 3 months",
  ];

  return (
    <section id="waitlist" className="py-16 bg-gradient-to-b from-white to-[#fce7ef]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#fbcfdf]">
          <div className="lg:grid lg:grid-cols-2">
            {/* Left Column: Form */}
            <div className="px-6 py-12 lg:px-8 xl:px-12">
              <div>
                <h2 className="section-heading">
                  Take the Menopause Assessment
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Complete this brief form to start your personalized menopause assessment and get early access to Menova.ai.
                </p>
              </div>
              
              <div className="mt-8">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-10"
                  >
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100">
                      <CheckCircle className="h-6 w-6 text-teal-600" />
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-gray-900">Assessment Request Received!</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Thank you for taking the first step in your menopause wellness journey. We'll email you soon with your assessment link and early access information.
                    </p>
                    <div className="mt-5">
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Back to home
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" className="border-[#fbcfdf] focus-visible:ring-primary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" className="border-[#fbcfdf] focus-visible:ring-primary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age Range <span className="text-gray-400">(Optional)</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-[#fbcfdf] focus-visible:ring-primary">
                                  <SelectValue placeholder="Select your age range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="35-40">35-40 years</SelectItem>
                                <SelectItem value="41-45">41-45 years</SelectItem>
                                <SelectItem value="46-50">46-50 years</SelectItem>
                                <SelectItem value="51-55">51-55 years</SelectItem>
                                <SelectItem value="56-60">56-60 years</SelectItem>
                                <SelectItem value="61+">61+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="menopauseStage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Where are you in your menopause journey? <span className="text-gray-400">(Optional)</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-[#fbcfdf] focus-visible:ring-primary">
                                  <SelectValue placeholder="Select your current stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="perimenopause">Perimenopause (Early Symptoms)</SelectItem>
                                <SelectItem value="menopause">Menopause (No Period for 12 Months)</SelectItem>
                                <SelectItem value="postmenopause">Postmenopause</SelectItem>
                                <SelectItem value="unsure">Not Sure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This helps us personalize your experience
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="referralSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>How did you hear about us?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-[#fbcfdf] focus-visible:ring-primary">
                                  <SelectValue placeholder="Please select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="social-media">Social Media</SelectItem>
                                <SelectItem value="search">Search Engine</SelectItem>
                                <SelectItem value="word-of-mouth">Friend or Family Member</SelectItem>
                                <SelectItem value="healthcare">Healthcare Provider</SelectItem>
                                <SelectItem value="blog">Blog or Article</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="privacyPolicy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="border-[#fbcfdf] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the <a href="#" className="text-primary hover:underline">Privacy Policy</a> and understand my data will be securely stored
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-[#be1d4f]"
                        disabled={waitlistMutation.isPending}
                      >
                        {waitlistMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Start Your Assessment"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </div>
            
            {/* Right Column: Benefits */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 h-full w-full object-cover gradient-primary-bg">
                <div className="h-full flex flex-col justify-center items-center p-12 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md">
                    <ClipboardCheck className="h-12 w-12 text-white mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Your Personalized Assessment</h3>
                    <p className="text-white/90 mb-6">
                      After completing this form, you'll receive:
                    </p>
                    <ul className="text-left space-y-4">
                      {benefits.map((benefit, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-start"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <CheckCircle className="h-5 w-5 text-white mr-2 mt-0.5" />
                          <span className="text-white">{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <div className="mt-8 flex items-center justify-center border-t border-white/20 pt-6">
                      <Calendar className="h-5 w-5 text-white mr-2" />
                      <span className="text-white">Complete assessment in just 5 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
